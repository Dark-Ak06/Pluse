from pydantic import BaseModel
from typing import Optional, Dict, Any

class AssistantQueryRequest(BaseModel):
    query: str

class AssistantQueryResponse(BaseModel):
    query: str
    answer: str

class DefectClassifyRequest(BaseModel):
    text: str

class DefectClassifyResponse(BaseModel):
    defect_type: str
    severity: str
    confidence: float
    suggested_title: str
    disclaimer: str

class RegionalSummaryResponse(BaseModel):
    summary: str
