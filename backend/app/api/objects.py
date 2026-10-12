from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import io
import csv

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.infrastructure import (
    InfraObject, InfraMilestone, InfraStatusLog,
    ObjectType, ObjectCategory, ObjectStage, ObjectHealth
)
from app.models.defect import Defect
from app.models.audit_log import AuditLog
from app.schemas.infrastructure import (
    InfraObjectResponse, InfraObjectDetailResponse,
    StatusLogCreate, MilestoneResponse, StatusLogResponse
)
from app.schemas.defect import DefectResponse
from app.services.flag_engine import FlagEngine
from app.services.export_service import ExportService
from app.core.config import settings

router = APIRouter(prefix="/objects", tags=["objects"])

@router.get("", response_model=List[InfraObjectResponse])
def get_objects(
    district: Optional[str] = None,
    stage: Optional[str] = None,
    category: Optional[str] = None,
    health_status: Optional[str] = None,
    has_lag: Optional[bool] = None,
    has_freshness_issue: Optional[bool] = None,
    contractor_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InfraObject)

    if district:
        query = query.filter(InfraObject.district == district)
    if stage:
        query = query.filter(InfraObject.stage == stage)
    if category:
        query = query.filter(InfraObject.category == category)
    if health_status:
        query = query.filter(InfraObject.health_status == health_status)
    if has_lag is not None:
        query = query.filter(InfraObject.has_lag_flag == has_lag)
    if has_freshness_issue is not None:
        query = query.filter(InfraObject.has_freshness_flag == has_freshness_issue)
    if contractor_id:
        query = query.filter(InfraObject.contractor_id == contractor_id)
    if search:
        s = f"%{search}%"
        query = query.filter((InfraObject.name.ilike(s)) | (InfraObject.code.ilike(s)))

    return query.all()

@router.get("/thresholds")
def get_thresholds():
    """Текущие настраиваемые пороги контроля."""
    return {
        "lag_percent_threshold": settings.LAG_PERCENT_THRESHOLD,
        "freshness_days_threshold": settings.FRESHNESS_DAYS_THRESHOLD,
        "budget_overrun_threshold_percent": settings.BUDGET_OVERRUN_THRESHOLD_PERCENT
    }

@router.post("/thresholds")
def update_thresholds(
    lag_threshold: float = Query(10.0),
    freshness_threshold: int = Query(14),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновление порогов флагов отставания и пересчет объектов на лету."""
    settings.LAG_PERCENT_THRESHOLD = lag_threshold
    settings.FRESHNESS_DAYS_THRESHOLD = freshness_threshold

    # Пересчитываем все объекты
    all_objs = db.query(InfraObject).all()
    for obj in all_objs:
        milestones = db.query(InfraMilestone).filter(InfraMilestone.object_id == obj.id).all()
        FlagEngine.apply_flags_to_object(obj, milestones)
    db.commit()

    return {
        "message": "Пороги успешно обновлены, флаги пересчитаны",
        "lag_threshold": settings.LAG_PERCENT_THRESHOLD,
        "freshness_threshold": settings.FRESHNESS_DAYS_THRESHOLD
    }

@router.get("/{id}", response_model=InfraObjectDetailResponse)
def get_object_detail(id: int, db: Session = Depends(get_db)):
    obj = db.query(InfraObject).filter(InfraObject.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Объект инфраструктуры не найден")

    # Пересчитываем флаги
    milestones = db.query(InfraMilestone).filter(InfraMilestone.object_id == id).all()
    FlagEngine.apply_flags_to_object(obj, milestones)
    db.commit()

    # Считаем связанные дефекты дороги
    linked_defects = []
    if obj.linked_road_section_id:
        linked_defects = db.query(Defect).filter(Defect.road_section_id == obj.linked_road_section_id).all()
    elif obj.linked_road_id:
        linked_defects = db.query(Defect).filter(Defect.road_id == obj.linked_road_id).all()

    overdue_count = sum(1 for d in linked_defects if d.is_overdue)

    # Формируем ответ
    res = InfraObjectDetailResponse.model_validate(obj)
    res.milestones = [MilestoneResponse.model_validate(m) for m in milestones]
    res.status_logs = [StatusLogResponse.model_validate(l) for l in obj.status_logs]
    res.linked_defects_count = len(linked_defects)
    res.linked_overdue_defects_count = overdue_count
    return res

@router.get("/{id}/defects", response_model=List[DefectResponse])
def get_object_linked_defects(id: int, db: Session = Depends(get_db)):
    """Ключевая связка: дефекты на том же участке дороги, где идет объект ремонта."""
    obj = db.query(InfraObject).filter(InfraObject.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Объект не найден")

    query = db.query(Defect)
    if obj.linked_road_section_id:
        query = query.filter(Defect.road_section_id == obj.linked_road_section_id)
    elif obj.linked_road_id:
        query = query.filter(Defect.road_id == obj.linked_road_id)
    else:
        return []

    return query.all()

@router.post("/{id}/status")
def update_object_status(
    id: int,
    data: StatusLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Быстрое обновление статуса ответственным куратором."""
    obj = db.query(InfraObject).filter(InfraObject.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Объект не найден")

    prev_p = obj.actual_progress
    new_p = min(100.0, max(0.0, data.new_progress))

    obj.actual_progress = new_p
    obj.last_status_update_at = datetime.utcnow()

    # Запись в журнал статусов
    log = InfraStatusLog(
        object_id=obj.id,
        updated_by_user_id=current_user.id if current_user else 1,
        prev_progress=prev_p,
        new_progress=new_p,
        comment=data.comment,
        photos_json="[]"
    )
    db.add(log)

    # Аудит
    audit = AuditLog(
        user_id=current_user.id if current_user else 1,
        user_name=current_user.full_name if current_user else "Система",
        user_role=current_user.role.value if current_user else "curator",
        action="UPDATE_STATUS",
        entity_type="InfraObject",
        entity_id=obj.id,
        details=f"Прогресс изменен с {prev_p}% на {new_p}%. Комментарий: {data.comment}"
    )
    db.add(audit)

    # Автоматический пересчет флагов
    milestones = db.query(InfraMilestone).filter(InfraMilestone.object_id == id).all()
    FlagEngine.apply_flags_to_object(obj, milestones)
    db.commit()

    return {"message": "Статус успешно обновлен", "new_progress": new_p, "health_status": obj.health_status}

@router.post("/import-csv")
async def import_csv_status(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Массовый импорт статусов объектов из CSV."""
    content = await file.read()
    try:
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        decoded = content.decode("cp1251")

    reader = csv.DictReader(io.StringIO(decoded))
    updated_count = 0

    for row in reader:
        code = row.get("code") or row.get("Код")
        new_progress_str = row.get("actual_progress") or row.get("Прогресс") or row.get("Факт")
        comment = row.get("comment") or row.get("Комментарий") or "Массовое обновление через CSV"

        if code and new_progress_str:
            try:
                new_p = float(new_progress_str.replace("%", "").strip())
                obj = db.query(InfraObject).filter(InfraObject.code == code.strip()).first()
                if obj:
                    prev_p = obj.actual_progress
                    obj.actual_progress = new_p
                    obj.last_status_update_at = datetime.utcnow()

                    log = InfraStatusLog(
                        object_id=obj.id,
                        updated_by_user_id=current_user.id if current_user else 1,
                        prev_progress=prev_p,
                        new_progress=new_p,
                        comment=comment
                    )
                    db.add(log)
                    milestones = db.query(InfraMilestone).filter(InfraMilestone.object_id == obj.id).all()
                    FlagEngine.apply_flags_to_object(obj, milestones)
                    updated_count += 1
            except ValueError:
                continue

    db.commit()
    return {"message": f"Успешно обновлено объектов: {updated_count}"}

@router.get("/export/excel")
def export_excel(db: Session = Depends(get_db)):
    """Выгрузка реестра в Excel."""
    objects = db.query(InfraObject).all()
    excel_bytes = ExportService.generate_excel_summary(objects)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=region_control_summary.xlsx"}
    )

@router.get("/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    """Выгрузка официальной сводки в PDF."""
    objects = db.query(InfraObject).all()
    pdf_bytes = ExportService.generate_pdf_summary(objects, settings.REGION_NAME)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=region_control_briefing.pdf"}
    )
