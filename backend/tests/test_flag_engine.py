from datetime import datetime, date, timedelta
from app.models.infrastructure import InfraObject, InfraMilestone, ObjectType, ObjectCategory, ObjectStage, ObjectHealth
from app.services.flag_engine import FlagEngine

def test_flag_engine_on_schedule():
    obj = InfraObject(
        code="INF-001",
        name="Строительство школы на 300 мест",
        type=ObjectType.CONSTRUCTION,
        category=ObjectCategory.SOCIAL,
        district="Есіл ауданы",
        latitude=51.15,
        longitude=71.42,
        budget_allocated=1_500_000_000,
        budget_spent=500_000_000,
        source_of_financing="Областной бюджет",
        stage=ObjectStage.CONSTRUCTION,
        planned_progress=40.0,
        actual_progress=38.0,
        last_status_update_at=datetime.utcnow() - timedelta(days=3)
    )
    res = FlagEngine.evaluate_object(obj, milestones=[])
    assert res["health_status"] == ObjectHealth.ON_SCHEDULE
    assert not res["has_lag_flag"]
    assert not res["has_freshness_flag"]
    assert not res["has_budget_overrun_flag"]

def test_flag_engine_critical_lag():
    obj = InfraObject(
        code="INF-002",
        name="Капитальный ремонт автодороги",
        type=ObjectType.MAJOR_REPAIR,
        category=ObjectCategory.ROAD,
        district="Зеренді ауданы",
        latitude=53.28,
        longitude=69.38,
        budget_allocated=800_000_000,
        budget_spent=400_000_000,
        source_of_financing="РБ",
        stage=ObjectStage.CONSTRUCTION,
        planned_progress=65.0,
        actual_progress=45.0,  # Lag = 20.0 pp > 10.0 threshold
        last_status_update_at=datetime.utcnow() - timedelta(days=5)
    )
    res = FlagEngine.evaluate_object(obj, milestones=[])
    assert res["health_status"] == ObjectHealth.DELAYED
    assert res["has_lag_flag"]
    assert res["lag_points"] == 20.0

def test_flag_engine_milestone_overdue():
    obj = InfraObject(
        code="INF-003",
        name="Строительство водопровода",
        type=ObjectType.CONSTRUCTION,
        category=ObjectCategory.UTILITIES,
        district="Нұра ауданы",
        latitude=50.25,
        longitude=71.55,
        budget_allocated=600_000_000,
        budget_spent=200_000_000,
        source_of_financing="ОБ",
        stage=ObjectStage.CONSTRUCTION,
        planned_progress=30.0,
        actual_progress=28.0,
        last_status_update_at=datetime.utcnow() - timedelta(days=2)
    )
    milestone = InfraMilestone(
        object_id=1,
        title="Монтаж водонапорной башни",
        planned_date=date.today() - timedelta(days=5),
        is_completed=False
    )
    res = FlagEngine.evaluate_object(obj, milestones=[milestone])
    assert res["health_status"] == ObjectHealth.DELAYED
    assert res["has_milestone_overdue_flag"]

def test_flag_engine_freshness_control_14_days():
    obj = InfraObject(
        code="INF-004",
        name="Благоустройство набережной",
        type=ObjectType.LANDSCAPING,
        category=ObjectCategory.SOCIAL,
        district="Бурабай ауданы",
        latitude=53.08,
        longitude=70.28,
        budget_allocated=250_000_000,
        budget_spent=100_000_000,
        source_of_financing="МБ",
        stage=ObjectStage.CONSTRUCTION,
        planned_progress=50.0,
        actual_progress=48.0,
        last_status_update_at=datetime.utcnow() - timedelta(days=20)  # 20 days > 14
    )
    res = FlagEngine.evaluate_object(obj, milestones=[])
    assert res["has_freshness_flag"]
    assert res["days_since_update"] == 20
    assert res["health_status"] == ObjectHealth.AT_RISK
