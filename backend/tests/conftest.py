import pytest
from datetime import datetime, date, timedelta
from app.models.contractor import Contractor
from app.models.infrastructure import InfraObject, InfraMilestone, ObjectType, ObjectCategory, ObjectStage, ObjectHealth
from app.models.road import Road, RoadSection
from app.models.defect import Defect, DefectType, DefectSeverity, DefectStatus

@pytest.fixture
def sample_contractor():
    return Contractor(
        id=1,
        name="ТОО «Сарыарқа Жол Құрылыс»",
        bin="180440012345",
        director_name="Ахметов Б. К.",
        phone="+7 (7162) 55-44-33",
        email="info@saryarka-road.kz",
        rating_score=100.0,
        is_systemic_problem=False
    )

@pytest.fixture
def sample_road_and_section(sample_contractor):
    road = Road(
        id=10,
        code="КВ-03",
        name="Көкшетау – Зеренді",
        total_length_km=50.0,
        district="Зеренді ауданы"
    )
    section = RoadSection(
        id=101,
        road_id=10,
        section_code="КВ-03-УЧ-1",
        start_km=0.0,
        end_km=25.0,
        length_km=25.0,
        center_latitude=53.2800,
        center_longitude=69.3800,
        contractor_id=sample_contractor.id
    )
    return road, section
