from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.contractor import ContractorResponse

class RoadSectionResponse(BaseModel):
    id: int
    road_id: int
    section_code: str
    start_km: float
    end_km: float
    length_km: float
    contractor_id: Optional[int] = None
    center_latitude: Optional[float] = None
    center_longitude: Optional[float] = None
    last_inspected_at: Optional[datetime] = None
    is_inspected_this_month: bool
    contractor: Optional[ContractorResponse] = None

    class Config:
        from_attributes = True

class RoadResponse(BaseModel):
    id: int
    code: str
    name: str
    total_length_km: float
    category: str
    district: Optional[str] = None
    start_point: Optional[str] = None
    end_point: Optional[str] = None
    sections: List[RoadSectionResponse] = []

    class Config:
        from_attributes = True

class NetworkCoverageResponse(BaseModel):
    total_km: float
    inspected_km: float
    coverage_percent: float
    uninspected_sections_count: int
    target_kpi_percent: float = 100.0
