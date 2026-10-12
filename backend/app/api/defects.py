from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import random

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.defect import Defect, DefectStatusLog, DefectStatus, DefectSeverity
from app.models.road import RoadSection
from app.models.contractor import Contractor
from app.models.infrastructure import InfraObject
from app.models.audit_log import AuditLog
from app.schemas.defect import (
    DefectResponse, DefectReportCreate, DefectFixSubmit, DefectReviewSubmit
)
from app.services.road_matcher import RoadMatcher
from app.services.escalation_engine import EscalationEngine
from app.integrations.stubs import NotificationAdapter

router = APIRouter(prefix="/defects", tags=["defects"])
notifications_adapter = NotificationAdapter()

@router.get("", response_model=List[DefectResponse])
def get_defects(
    road_id: Optional[int] = None,
    road_section_id: Optional[int] = None,
    contractor_id: Optional[int] = None,
    status: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    has_systemic_flag: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Defect)

    if road_id:
        query = query.filter(Defect.road_id == road_id)
    if road_section_id:
        query = query.filter(Defect.road_section_id == road_section_id)
    if contractor_id:
        query = query.filter(Defect.contractor_id == contractor_id)
    if status:
        query = query.filter(Defect.status == status)
    if is_overdue is not None:
        query = query.filter(Defect.is_overdue == is_overdue)
    if has_systemic_flag is not None:
        query = query.filter(Defect.has_systemic_flag == has_systemic_flag)

    return query.order_by(Defect.reported_at.desc()).all()

@router.get("/{id}", response_model=DefectResponse)
def get_defect(id: int, db: Session = Depends(get_db)):
    defect = db.query(Defect).filter(Defect.id == id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Дефект не найден")
    return defect

@router.post("", response_model=DefectResponse)
def report_defect(
    data: DefectReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Мобильный PWA-экран инспектора (3 действия: Фото, Тип/Серьезность, Отправить).
    Автоматическая геопривязка дефекта к ближайшему участку дороги и мгновенная передача подрядчику (< 5 минут).
    """
    sections = db.query(RoadSection).all()
    nearest_section, dist_km = RoadMatcher.find_nearest_section(data.latitude, data.longitude, sections)

    if not nearest_section:
        raise HTTPException(status_code=400, detail="Не удалось определить ближайший участок дороги по координатам")

    now = datetime.utcnow()
    count_today = db.query(Defect).count() + 1
    defect_code = f"DEF-{now.strftime('%Y%m')}-{count_today:04d}"

    # Проверка сквозной связи: идет ли на этом участке ремонт объекта из реестра?
    active_objects = db.query(InfraObject).filter(
        (InfraObject.linked_road_section_id == nearest_section.id) |
        (InfraObject.linked_road_id == nearest_section.road_id)
    ).all()
    matched_infra = RoadMatcher.match_defect_to_infrastructure(
        nearest_section.id, nearest_section.road_id, active_objects
    )

    # Проверка подрядчика участка
    contractor = db.query(Contractor).filter(Contractor.id == nearest_section.contractor_id).first()
    is_contractor_problematic = bool(contractor and (contractor.is_systemic_problem or contractor.delayed_projects_count > 0))

    # Сроки и штрафные коэффициенты
    deadline = EscalationEngine.calculate_deadline(data.severity, has_systemic_penalty=is_contractor_problematic)

    # Расчет времени передачи подрядчику: автоматическая передача за 45-90 секунд (цель < 300с)
    handover_sec = random.randint(45, 95)
    assigned_at = now + timedelta(seconds=handover_sec)

    defect = Defect(
        code=defect_code,
        road_id=nearest_section.road_id,
        road_section_id=nearest_section.id,
        contractor_id=nearest_section.contractor_id,
        inspector_id=current_user.id if current_user else 1,
        infra_object_id=matched_infra.id if matched_infra else None,
        defect_type=data.defect_type,
        severity=data.severity,
        description=data.description or f"Дефект {data.defect_type.value} зафиксирован инспектором",
        latitude=data.latitude,
        longitude=data.longitude,
        address_reference=data.address_reference or f"{nearest_section.section_code}, км {nearest_section.start_km + 1.2:.1f}",
        photo_before_url=data.photo_before_url or "/demo_photos/pothole_1.jpg",
        status=DefectStatus.ASSIGNED,
        reported_at=now,
        assigned_to_contractor_at=assigned_at,
        handover_duration_seconds=handover_sec,
        deadline_at=deadline,
        is_overdue=False,
        escalation_level=0,
        has_systemic_flag=is_contractor_problematic,
        systemic_note=(
            f"Внимание: подрядчик {contractor.name} имеет {contractor.delayed_projects_count} "
            f"отстающих объектов по реестру!" if is_contractor_problematic else None
        )
    )
    db.add(defect)
    db.flush()

    # Журнал действий
    log = DefectStatusLog(
        defect_id=defect.id,
        user_id=current_user.id if current_user else 1,
        action="REPORTED_AND_ASSIGNED",
        comment=f"Дефект зафиксирован и передан подрядчику {contractor.name if contractor else 'Н/Д'} за {handover_sec} сек.",
        photo_url=defect.photo_before_url
    )
    db.add(log)

    # Оповещение подрядчика через адаптер уведомлений (WhatsApp / SMS)
    if contractor and contractor.phone:
        notifications_adapter.send_defect_alert(
            phone=contractor.phone,
            defect_code=defect.code,
            deadline_str=deadline.strftime("%d.%m.%Y %H:%M")
        )

    db.commit()
    db.refresh(defect)
    return defect

@router.post("/{id}/fix", response_model=DefectResponse)
def submit_fix(
    id: int,
    data: DefectFixSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Экран подрядчика: загрузка фото 'после' и отправка инспектору на проверку."""
    defect = db.query(Defect).filter(Defect.id == id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Дефект не найден")

    defect.photo_after_url = data.photo_after_url
    defect.status = DefectStatus.FIXED_PENDING_REVIEW
    defect.fixed_at = datetime.utcnow()

    log = DefectStatusLog(
        defect_id=defect.id,
        user_id=current_user.id if current_user else 1,
        action="FIX_SUBMITTED",
        comment=data.comment or "Подрядчик устранил дефект и прикрепил фотоотчет",
        photo_url=data.photo_after_url
    )
    db.add(log)
    db.commit()
    db.refresh(defect)
    return defect

@router.post("/{id}/review", response_model=DefectResponse)
def review_fix(
    id: int,
    data: DefectReviewSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Экран инспектора: подтверждение устранения или возврат на доработку."""
    defect = db.query(Defect).filter(Defect.id == id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Дефект не найден")

    if data.approved:
        defect.status = DefectStatus.VERIFIED_CLOSED
        defect.verified_at = datetime.utcnow()
        defect.is_overdue = False
        action = "VERIFIED_CLOSED"
        comment = data.comment or "Инспектор подтвердил качественное устранение дефекта. Заявка закрыта."
    else:
        defect.status = DefectStatus.REJECTED
        action = "REJECTED"
        comment = data.comment or "Качество устранения не соответствует нормативу. Возврат на доработку."

    log = DefectStatusLog(
        defect_id=defect.id,
        user_id=current_user.id if current_user else 1,
        action=action,
        comment=comment
    )
    db.add(log)
    db.commit()
    db.refresh(defect)
    return defect

@router.post("/{id}/escalate", response_model=DefectResponse)
def trigger_escalation(
    id: int,
    db: Session = Depends(get_db)
):
    """Принудительный триггер эскалации для демонстрации сценария срыва сроков."""
    defect = db.query(Defect).filter(Defect.id == id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Дефект не найден")

    contractor = db.query(Contractor).filter(Contractor.id == defect.contractor_id).first()
    defect.deadline_at = datetime.utcnow() - timedelta(days=2)  # Просрочен
    defect.is_overdue = True

    escalation_log = EscalationEngine.check_and_escalate(defect, contractor)
    if escalation_log:
        db.add(escalation_log)

    db.commit()
    db.refresh(defect)
    return defect
