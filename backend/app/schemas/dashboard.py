from pydantic import BaseModel
from typing import List, Optional
from app.schemas.contractor import ContractorResponse
from app.schemas.infrastructure import InfraObjectResponse

class DashboardKpi(BaseModel):
    total_objects: int
    objects_on_schedule: int
    objects_at_risk: int
    objects_delayed: int
    freshness_rate_percent: float  # KPI: 90% с актуальным статусом
    total_roads_km: float
    inspected_roads_km: float
    coverage_rate_percent: float   # KPI: 100% за месяц
    total_defects: int
    defects_in_progress: int
    defects_fixed: int
    defects_overdue: int
    defects_on_time_percent: float # KPI: 95% устранено в срок
    avg_handover_minutes: float    # KPI: < 5 минут

class DashboardResponse(BaseModel):
    kpi: DashboardKpi
    top_lagging_objects: List[InfraObjectResponse]
    top_problem_contractors: List[ContractorResponse]
    district_breakdown: List[dict]
    stage_breakdown: List[dict]
