from typing import List
from app.models.contractor import Contractor
from app.models.infrastructure import InfraObject, ObjectHealth
from app.models.defect import Defect, DefectStatus

class RatingService:
    @staticmethod
    def calculate_contractor_discipline(
        contractor: Contractor,
        objects: List[InfraObject],
        defects: List[Defect]
    ) -> dict:
        """
        Сводит доли просрочек по объектам и дефектам.
        Выявляет подрядчиков, у которых отставание и по объектам, и по дефектам
        одновременно, как системную проблему региона.
        """
        total_projects = len(objects)
        delayed_projects = [o for o in objects if o.health_status == ObjectHealth.DELAYED or o.has_lag_flag]
        delayed_projects_count = len(delayed_projects)

        total_defects = len(defects)
        overdue_defects = [d for d in defects if d.is_overdue or d.status == DefectStatus.ESCALATED]
        overdue_defects_count = len(overdue_defects)

        # Базовый расчет баллов дисциплины (макс 100)
        score = 100.0

        if total_projects > 0:
            project_delay_rate = delayed_projects_count / total_projects
            score -= project_delay_rate * 40.0

        if total_defects > 0:
            defect_delay_rate = overdue_defects_count / total_defects
            score -= defect_delay_rate * 40.0

        # СИСТЕМНАЯ ПРОБЛЕМА: просрочки и по объектам, и по дорожным дефектам одновременно!
        is_systemic = (delayed_projects_count > 0) and (overdue_defects_count > 0)
        if is_systemic:
            score -= 20.0  # Дополнительный штраф за системность
            systemic_reason = (
                f"СИСТЕМНЫЙ СБОЙ: {delayed_projects_count} из {total_projects} объектов с отставанием "
                f"и {overdue_defects_count} из {total_defects} дорожных дефектов просрочено."
            )
        else:
            systemic_reason = None

        final_score = max(0.0, min(100.0, round(score, 1)))

        # Обновление модели подрядчика
        contractor.active_projects_count = total_projects
        contractor.delayed_projects_count = delayed_projects_count
        contractor.active_defects_count = total_defects
        contractor.overdue_defects_count = overdue_defects_count
        contractor.rating_score = final_score
        contractor.is_systemic_problem = is_systemic
        contractor.systemic_reason = systemic_reason

        return {
            "contractor_id": contractor.id,
            "contractor_name": contractor.name,
            "rating_score": final_score,
            "is_systemic_problem": is_systemic,
            "systemic_reason": systemic_reason,
            "total_projects": total_projects,
            "delayed_projects_count": delayed_projects_count,
            "total_defects": total_defects,
            "overdue_defects_count": overdue_defects_count
        }
