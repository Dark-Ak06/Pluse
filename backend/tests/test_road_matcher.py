from app.models.road import RoadSection
from app.models.infrastructure import InfraObject, ObjectType, ObjectCategory, ObjectStage
from app.services.road_matcher import RoadMatcher

def test_road_matcher_find_nearest_section():
    sec1 = RoadSection(
        id=1,
        road_id=1,
        section_code="КВ-01-УЧ-1",
        start_km=0.0,
        end_km=20.0,
        length_km=20.0,
        center_latitude=53.2800,
        center_longitude=69.3800
    )
    sec2 = RoadSection(
        id=2,
        road_id=2,
        section_code="КВ-02-УЧ-1",
        start_km=0.0,
        end_km=30.0,
        length_km=30.0,
        center_latitude=51.1800,
        center_longitude=71.4400
    )

    # Точка рядом с sec1 (Көкшетау / Зеренді)
    found, dist = RoadMatcher.find_nearest_section(53.2850, 69.3820, [sec1, sec2])
    assert found is not None
    assert found.id == sec1.id
    assert dist < 1.0  # Менее 1 км

def test_road_matcher_cross_link_infrastructure():
    infra_obj = InfraObject(
        id=55,
        code="INF-ROAD-01",
        name="Средний ремонт автодороги КВ-03",
        type=ObjectType.MEDIUM_REPAIR,
        category=ObjectCategory.ROAD,
        district="Зеренді ауданы",
        latitude=53.28,
        longitude=69.38,
        stage=ObjectStage.CONSTRUCTION,
        planned_progress=50.0,
        actual_progress=35.0,
        linked_road_id=10,
        linked_road_section_id=101
    )

    # Проверяем связку дефекта с объектом ремонта
    matched = RoadMatcher.match_defect_to_infrastructure(
        road_section_id=101,
        road_id=10,
        active_objects=[infra_obj]
    )
    assert matched is not None
    assert matched.id == 55
    assert matched.code == "INF-ROAD-01"
