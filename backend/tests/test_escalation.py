from datetime import datetime, timedelta
from app.models.defect import Defect, DefectType, DefectSeverity, DefectStatus
from app.models.contractor import Contractor
from app.services.escalation_engine import EscalationEngine

def test_escalation_handover_sla_5_minutes():
    reported_time = datetime.utcnow() - timedelta(seconds=75)  # 1.25 минуты назад
    defect = Defect(
        id=1,
        code="DEF-001",
        road_id=1,
        defect_type=DefectType.POTHOLE,
        severity=DefectSeverity.HIGH,
        latitude=53.28,
        longitude=69.38,
        reported_at=reported_time,
        status=DefectStatus.REPORTED
    )

    duration = EscalationEngine.process_handover(defect, contractor_id=1)
    assert defect.status == DefectStatus.ASSIGNED
    assert defect.contractor_id == 1
    assert duration <= 300  # В рамках 5 минут KPI!

def test_escalation_systemic_penalty_rule():
    # Подрядчик с отставанием по строительным объектам
    contractor = Contractor(
        id=1,
        name="ТОО «Сарыарқа Жол Құрылыс»",
        bin="180440012345",
        rating_score=45.0,
        is_systemic_problem=True,
        delayed_projects_count=2
    )

    # Дефект просрочен
    defect = Defect(
        id=10,
        code="DEF-SYS-01",
        road_id=1,
        contractor_id=1,
        defect_type=DefectType.POTHOLE,
        severity=DefectSeverity.EMERGENCY,
        latitude=53.28,
        longitude=69.38,
        reported_at=datetime.utcnow() - timedelta(days=2),
        deadline_at=datetime.utcnow() - timedelta(hours=5),
        status=DefectStatus.ASSIGNED,
        escalation_level=0
    )

    escalation_log = EscalationEngine.check_and_escalate(defect, contractor)
    assert escalation_log is not None
    # Системный подрядчик сразу эскалируется на 2-й уровень (Акимат / Управление дорог)!
    assert defect.escalation_level == 2
    assert defect.has_systemic_flag is True
    assert escalation_log.is_systemic is True
    assert "КРИТИЧЕСКАЯ ЭСКАЛАЦИЯ" in escalation_log.reason
