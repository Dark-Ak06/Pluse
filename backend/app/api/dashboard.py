from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.infrastructure import InfraObject, ObjectHealth, ObjectStage
from app.models.road import RoadSection
from app.models.defect import Defect, DefectStatus
from app.models.contractor import Contractor
from app.schemas.dashboard import DashboardResponse, DashboardKpi
from app.schemas.infrastructure import InfraObjectResponse
from app.schemas.contractor import ContractorResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/overview", response_model=DashboardResponse)
def get_dashboard_overview(db: Session = Depends(get_db)):
    # 1. Объекты реестра
    all_objects = db.query(InfraObject).all()
    total_objects = len(all_objects)
    on_schedule_count = sum(1 for o in all_objects if o.health_status == ObjectHealth.ON_SCHEDULE)
    at_risk_count = sum(1 for o in all_objects if o.health_status == ObjectHealth.AT_RISK)
    delayed_count = sum(1 for o in all_objects if o.health_status == ObjectHealth.DELAYED or o.has_lag_flag)
    fresh_count = sum(1 for o in all_objects if not o.has_freshness_flag)
    freshness_rate = round((fresh_count / total_objects) * 100, 1) if total_objects > 0 else 0.0

    # 2. Дороги и инспекция
    all_sections = db.query(RoadSection).all()
    total_km = sum(s.length_km for s in all_sections)
    inspected_km = sum(s.length_km for s in all_sections if s.is_inspected_this_month)
    coverage_rate = round((inspected_km / total_km) * 100, 1) if total_km > 0 else 0.0

    # 3. Дефекты
    all_defects = db.query(Defect).all()
    total_defects = len(all_defects)
    defects_in_progress = sum(1 for d in all_defects if d.status in [DefectStatus.ASSIGNED, DefectStatus.IN_PROGRESS])
    defects_fixed = sum(1 for d in all_defects if d.status == DefectStatus.VERIFIED_CLOSED)
    defects_overdue = sum(1 for d in all_defects if d.is_overdue or d.status == DefectStatus.ESCALATED)
    
    on_time_defects = total_defects - defects_overdue
    defects_on_time_pct = round((on_time_defects / total_defects) * 100, 1) if total_defects > 0 else 0.0

    # Среднее время передачи (сек -> мин)
    durations = [d.handover_duration_seconds for d in all_defects if d.handover_duration_seconds > 0]
    avg_handover_min = round((sum(durations) / len(durations)) / 60.0, 2) if durations else 1.2

    # Топ-5 отстающих объектов
    top_lagging = sorted(
        all_objects,
        key=lambda x: (not x.has_lag_flag, -x.lag_points)
    )[:5]

    # Топ проблемных подрядчиков (системные нарушители вверху)
    all_contractors = db.query(Contractor).all()
    top_problem_contractors = sorted(
        all_contractors,
        key=lambda c: (not c.is_systemic_problem, c.rating_score)
    )[:5]

    # Разбивка по районам
    districts_map = {}
    for o in all_objects:
        districts_map.setdefault(o.district, {"district": o.district, "objects_count": 0, "delayed_count": 0})
        districts_map[o.district]["objects_count"] += 1
        if o.has_lag_flag or o.health_status == ObjectHealth.DELAYED:
            districts_map[o.district]["delayed_count"] += 1

    district_breakdown = list(districts_map.values())

    # Разбивка по стадиям жизненного цикла
    stages_order = [
        ObjectStage.PLANNING, ObjectStage.PROCUREMENT, ObjectStage.CONSTRUCTION,
        ObjectStage.ACCEPTANCE, ObjectStage.OPERATION
    ]
    stage_titles = {
        ObjectStage.PLANNING: "1. Планирование",
        ObjectStage.PROCUREMENT: "2. Закупка",
        ObjectStage.CONSTRUCTION: "3. Строительство/Ремонт",
        ObjectStage.ACCEPTANCE: "4. Приёмка",
        ObjectStage.OPERATION: "5. Эксплуатация"
    }
    stage_breakdown = []
    for st in stages_order:
        cnt = sum(1 for o in all_objects if o.stage == st)
        stage_breakdown.append({
            "stage": st.value,
            "label": stage_titles[st],
            "count": cnt
        })

    kpi = DashboardKpi(
        total_objects=total_objects,
        objects_on_schedule=on_schedule_count,
        objects_at_risk=at_risk_count,
        objects_delayed=delayed_count,
        freshness_rate_percent=freshness_rate,
        total_roads_km=round(total_km, 1),
        inspected_roads_km=round(inspected_km, 1),
        coverage_rate_percent=coverage_rate,
        total_defects=total_defects,
        defects_in_progress=defects_in_progress,
        defects_fixed=defects_fixed,
        defects_overdue=defects_overdue,
        defects_on_time_percent=defects_on_time_pct,
        avg_handover_minutes=avg_handover_min
    )

    return DashboardResponse(
        kpi=kpi,
        top_lagging_objects=[InfraObjectResponse.model_validate(o) for o in top_lagging],
        top_problem_contractors=[ContractorResponse.model_validate(c) for c in top_problem_contractors],
        district_breakdown=district_breakdown,
        stage_breakdown=stage_breakdown
    )
