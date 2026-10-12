from pydantic import BaseModel
from typing import Optional

class ContractorBase(BaseModel):
    name: str
    bin: str
    director_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class ContractorCreate(ContractorBase):
    pass

class ContractorResponse(ContractorBase):
    id: int
    rating_score: float
    is_systemic_problem: bool
    systemic_reason: Optional[str] = None
    active_projects_count: int
    delayed_projects_count: int
    active_defects_count: int
    overdue_defects_count: int

    class Config:
        from_attributes = True
