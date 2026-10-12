from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db
from app.models.road import Road, RoadSection
from app.schemas.road import RoadResponse, RoadSectionResponse, NetworkCoverageResponse

router = APIRouter(prefix="/roads", tags=["roads"])

@router.get("", response_model=List[RoadResponse])
def get_roads(db: Session = Depends(get_db)):
    roads = db.query(Road).all()
    return roads

@router.get("/sections/all", response_model=List[RoadSectionResponse])
def get_all_sections(db: Session = Depends(get_db)):
    sections = db.query(RoadSection).all()
    return sections

@router.get("/coverage/monthly", response_model=NetworkCoverageResponse)
def get_network_coverage(db: Session = Depends(get_db)):
    """KPI: Покрытие сети осмотром за месяц (цель 100% сети за месяц)."""
    sections = db.query(RoadSection).all()
    total_km = sum(s.length_km for s in sections)
    inspected_km = sum(s.length_km for s in sections if s.is_inspected_this_month)
    uninspected_count = sum(1 for s in sections if not s.is_inspected_this_month)
    
    coverage_pct = round((inspected_km / total_km) * 100, 1) if total_km > 0 else 0.0

    return NetworkCoverageResponse(
        total_km=round(total_km, 1),
        inspected_km=round(inspected_km, 1),
        coverage_percent=coverage_pct,
        uninspected_sections_count=uninspected_count,
        target_kpi_percent=100.0
    )

@router.get("/{id}", response_model=RoadResponse)
def get_road(id: int, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Дорога не найдена")
    return road
