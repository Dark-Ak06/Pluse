from app.models.contractor import Contractor
from app.models.infrastructure import InfraObject, ObjectType, ObjectCategory, ObjectHealth
from app.models.defect import Defect, DefectType, DefectSeverity, DefectStatus
from app.services.rating_service import RatingService

def test_systemic_rating_calculation():
    contractor = Contractor(
        id=1,
        name="ТОО «Сарыарқа Жол Құрылыс»",
        bin="180440012345"
    )

    # 2 объекта: 1 с отставанием, 1 в графике
    obj1 = InfraObject(id=1, health_status=ObjectHealth.DELAYED, has_lag_flag=True)
    obj2 = InfraObject(id=2, health_status=ObjectHealth.ON_SCHEDULE, has_lag_flag=False)

    # 3 дефекта: 1 просрочен, 2 в работе
    def1 = Defect(id=101, is_overdue=True, status=DefectStatus.ESCALATED)
    def2 = Defect(id=102, is_overdue=False, status=DefectStatus.IN_PROGRESS)
    def3 = Defect(id=103, is_overdue=False, status=DefectStatus.VERIFIED_CLOSED)

    result = RatingService.calculate_contractor_discipline(
        contractor=contractor,
        objects=[obj1, obj2],
        defects=[def1, def2, def3]
    )

    assert result["is_systemic_problem"] is True
    assert contractor.is_systemic_problem is True
    assert "СИСТЕМНЫЙ СБОЙ" in result["systemic_reason"]
    # Оценка должна быть существенно снижена из-за штрафа за системность
    assert result["rating_score"] < 60.0
