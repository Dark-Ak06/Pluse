from datetime import datetime, date
from typing import List, Optional
from app.core.config import settings
from app.models.infrastructure import InfraObject, InfraMilestone, ObjectHealth

class FlagEngine:
    @staticmethod
    def evaluate_object(
        obj: InfraObject,
        milestones: Optional[List[InfraMilestone]] = None,
        lag_threshold: Optional[float] = None,
        freshness_threshold: Optional[int] = None
    ) -> dict:
        """
        Рассчитывает автоматические флаги отставания по настраиваемым правилам.
        """
        lag_thresh = lag_threshold if lag_threshold is not None else settings.LAG_PERCENT_THRESHOLD
        fresh_thresh = freshness_threshold if freshness_threshold is not None else settings.FRESHNESS_DAYS_THRESHOLD

        today = date.today()
        now = datetime.utcnow()

        # 1. Отставание факта от плана
        planned = obj.planned_progress or 0.0
        actual = obj.actual_progress or 0.0
        lag_points = max(0.0, round(planned - actual, 1))
        has_lag = lag_points > lag_thresh

        # 2. Просроченные вехи
        has_milestone_overdue = False
        overdue_milestone_titles = []
        if milestones:
            for m in milestones:
                if not m.is_completed and m.planned_date and m.planned_date < today:
                    has_milestone_overdue = True
                    overdue_milestone_titles.append(m.title)

        # 3. Контроль актуальности статуса (> 14 дней)
        days_since_update = 0
        if obj.last_status_update_at:
            delta = now - obj.last_status_update_at
            days_since_update = max(0, delta.days)
        has_freshness_flag = days_since_update > fresh_thresh

        # 4. Превышение сметы / бюджета
        allocated = obj.budget_allocated or 0.0
        spent = obj.budget_spent or 0.0
        budget_overrun_amount = max(0.0, round(spent - allocated, 2))
        has_budget_overrun = budget_overrun_amount > 0.0

        # Формирование текстового резюме флагов
        reasons = []
        if has_lag:
            reasons.append(f"Отставание от графика на {lag_points} п.п. (порог {lag_thresh} п.п.)")
        if has_milestone_overdue:
            reasons.append(f"Просрочены вехи ({len(overdue_milestone_titles)} шт.): {', '.join(overdue_milestone_titles[:2])}")
        if has_freshness_flag:
            reasons.append(f"Статус не обновлялся {days_since_update} дн. (порог {fresh_thresh} дн.)")
        if has_budget_overrun:
            reasons.append(f"Превышение сметы на {budget_overrun_amount:,.0f} ₸")

        # Определение итогового статуса здоровья объекта
        if has_lag or has_milestone_overdue:
            computed_health = ObjectHealth.DELAYED
        elif has_freshness_flag or (lag_points > lag_thresh / 2) or has_budget_overrun:
            computed_health = ObjectHealth.AT_RISK
        else:
            computed_health = ObjectHealth.ON_SCHEDULE

        return {
            "health_status": computed_health,
            "has_lag_flag": has_lag,
            "lag_points": lag_points,
            "has_milestone_overdue_flag": has_milestone_overdue,
            "has_freshness_flag": has_freshness_flag,
            "days_since_update": days_since_update,
            "has_budget_overrun_flag": has_budget_overrun,
            "budget_overrun_amount": budget_overrun_amount,
            "flag_summary": "; ".join(reasons) if reasons else "В графике, без замечаний"
        }

    @staticmethod
    def apply_flags_to_object(obj: InfraObject, milestones: Optional[List[InfraMilestone]] = None):
        res = FlagEngine.evaluate_object(obj, milestones)
        obj.health_status = res["health_status"]
        obj.has_lag_flag = res["has_lag_flag"]
        obj.lag_points = res["lag_points"]
        obj.has_milestone_overdue_flag = res["has_milestone_overdue_flag"]
        obj.has_freshness_flag = res["has_freshness_flag"]
        obj.days_since_update = res["days_since_update"]
        obj.has_budget_overrun_flag = res["has_budget_overrun_flag"]
        obj.budget_overrun_amount = res["budget_overrun_amount"]
        obj.flag_summary = res["flag_summary"]
