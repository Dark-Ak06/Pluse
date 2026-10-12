from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.assistant import get_llm_provider
from app.schemas.assistant import (
    AssistantQueryRequest, AssistantQueryResponse,
    DefectClassifyRequest, DefectClassifyResponse,
    RegionalSummaryResponse
)
from app.models.infrastructure import InfraObject, ObjectHealth
from app.models.defect import Defect
from app.models.contractor import Contractor
from app.models.road import RoadSection

router = APIRouter(prefix="/assistant", tags=["assistant"])

@router.post("/query", response_model=AssistantQueryResponse)
def assistant_search(data: AssistantQueryRequest, db: Session = Depends(get_db)):
    """Поиск на естественном языке через ИИ-помощника."""
    provider = get_llm_provider()
    context_data = {
        "total_objects": db.query(InfraObject).count(),
        "delayed_objects": db.query(InfraObject).filter(InfraObject.has_lag_flag == True).count(),
        "total_defects": db.query(Defect).count(),
        "overdue_defects": db.query(Defect).filter(Defect.is_overdue == True).count()
    }
    answer = provider.answer_query(data.query, context_data)
    return AssistantQueryResponse(query=data.query, answer=answer)

@router.post("/classify-defect", response_model=DefectClassifyResponse)
def classify_defect_text(data: DefectClassifyRequest):
    """Автоматическая подсказка типа и серьезности дефекта по описанию."""
    provider = get_llm_provider()
    result = provider.classify_defect(data.text)
    return DefectClassifyResponse(**result)

@router.post("/regional-summary", response_model=RegionalSummaryResponse)
def generate_summary(db: Session = Depends(get_db)):
    """Кнопка 'Сформировать сводку' на дашборде акима."""
    provider = get_llm_provider()
    
    total_objs = db.query(InfraObject).count()
    delayed_objs = db.query(InfraObject).filter(InfraObject.has_lag_flag == True).count()
    freshness_issues = db.query(InfraObject).filter(InfraObject.has_freshness_flag == True).count()
    total_defs = db.query(Defect).count()
    overdue_defs = db.query(Defect).filter(Defect.is_overdue == True).count()
    
    problematic = db.query(Contractor).filter(Contractor.is_systemic_problem == True).all()
    problem_names = [f"ТОО «{c.name.replace('ТОО «', '').replace('»', '')}»" for c in problematic]
    
    sections = db.query(RoadSection).all()
    total_km = sum(s.length_km for s in sections)
    inspected_km = sum(s.length_km for s in sections if s.is_inspected_this_month)

    context = {
        "total_objects": total_objs,
        "delayed_objects": delayed_objs,
        "freshness_issues": freshness_issues,
        "total_defects": total_defs,
        "overdue_defects": overdue_defs,
        "problem_contractors": problem_names,
        "total_km": round(total_km, 1),
        "inspected_km": round(inspected_km, 1)
    }

    summary = provider.generate_regional_summary(context)
    return RegionalSummaryResponse(summary=summary)
