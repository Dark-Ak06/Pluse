from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.infrastructure import ObjectType, ObjectCategory, ObjectStage, ObjectHealth
from app.schemas.contractor import ContractorResponse

class MilestoneBase(BaseModel):
    title: str
    planned_date: date
    actual_date: Optional[date] = None
    is_completed: bool = False
    is_overdue: bool = False

class MilestoneResponse(MilestoneBase):
    id: int
    object_id: int

    class Config:
        from_attributes = True

class StatusLogCreate(BaseModel):
    new_progress: float
    comment: Optional[str] = None
    photos: Optional[List[str]] = None

class StatusLogResponse(BaseModel):
    id: int
    object_id: int
    prev_progress: float
    new_progress: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InfraObjectBase(BaseModel):
    code: str
    name: str
    type: ObjectType
    category: ObjectCategory
    district: str
    location_description: Optional[str] = None
    latitude: float
    longitude: float
    budget_allocated: float
    budget_spent: float
    source_of_financing: str
    curator_name: Optional[str] = None
    curator_phone: Optional[str] = None
    stage: ObjectStage
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    planned_progress: float
    actual_progress: float
    contractor_id: Optional[int] = None
    linked_road_id: Optional[int] = None
    linked_road_section_id: Optional[int] = None

class InfraObjectCreate(InfraObjectBase):
    pass

class InfraObjectResponse(InfraObjectBase):
    id: int
    health_status: ObjectHealth
    last_status_update_at: Optional[datetime] = None
    has_lag_flag: bool
    lag_points: float
    has_milestone_overdue_flag: bool
    has_freshness_flag: bool
    days_since_update: int
    has_budget_overrun_flag: bool
    budget_overrun_amount: float
    flag_summary: Optional[str] = None
    contractor: Optional[ContractorResponse] = None

    class Config:
        from_attributes = True

class InfraObjectDetailResponse(InfraObjectResponse):
    milestones: List[MilestoneResponse] = []
    status_logs: List[StatusLogResponse] = []
    linked_defects_count: int = 0
    linked_overdue_defects_count: int = 0
