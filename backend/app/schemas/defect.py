from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.defect import DefectType, DefectSeverity, DefectStatus
from app.schemas.contractor import ContractorResponse

class DefectReportCreate(BaseModel):
    defect_type: DefectType
    severity: DefectSeverity = DefectSeverity.MEDIUM
    description: Optional[str] = None
    latitude: float
    longitude: float
    address_reference: Optional[str] = None
    photo_before_url: Optional[str] = None

class DefectFixSubmit(BaseModel):
    photo_after_url: str
    comment: Optional[str] = None

class DefectReviewSubmit(BaseModel):
    approved: bool
    comment: Optional[str] = None

class DefectResponse(BaseModel):
    id: int
    code: str
    road_id: int
    road_section_id: Optional[int] = None
    contractor_id: Optional[int] = None
    inspector_id: Optional[int] = None
    infra_object_id: Optional[int] = None
    defect_type: DefectType
    severity: DefectSeverity
    description: Optional[str] = None
    latitude: float
    longitude: float
    address_reference: Optional[str] = None
    photo_before_url: Optional[str] = None
    photo_after_url: Optional[str] = None
    status: DefectStatus
    reported_at: datetime
    assigned_to_contractor_at: Optional[datetime] = None
    handover_duration_seconds: int
    deadline_at: Optional[datetime] = None
    fixed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    is_overdue: bool
    escalation_level: int
    has_systemic_flag: bool
    systemic_note: Optional[str] = None
    contractor: Optional[ContractorResponse] = None

    class Config:
        from_attributes = True
