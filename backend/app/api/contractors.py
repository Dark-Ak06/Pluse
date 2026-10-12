from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_db
from app.models.contractor import Contractor
from app.schemas.contractor import ContractorResponse

router = APIRouter(prefix="/contractors", tags=["contractors"])

@router.get("", response_model=List[ContractorResponse])
def get_contractors(
    systemic_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Рейтинг дисциплины подрядчиков.
    Выделяет системных нарушителей с одновременным срывом строек и дефектов.
    """
    query = db.query(Contractor)
    if systemic_only is not None:
        query = query.filter(Contractor.is_systemic_problem == systemic_only)

    # Сортируем: сначала системно проблемные, затем по возрастанию рейтинга
    return query.order_by(Contractor.is_systemic_problem.desc(), Contractor.rating_score.asc()).all()

@router.get("/{id}", response_model=ContractorResponse)
def get_contractor(id: int, db: Session = Depends(get_db)):
    c = db.query(Contractor).filter(Contractor.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Подрядчик не найден")
    return c
