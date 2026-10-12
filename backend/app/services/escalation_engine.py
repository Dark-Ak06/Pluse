from datetime import datetime, timedelta
from typing import Optional, Tuple
from app.models.defect import Defect, DefectSeverity, DefectStatus
from app.models.contractor import Contractor
from app.models.escalation import EscalationLog

class EscalationEngine:
    @staticmethod
    def calculate_deadline(severity: DefectSeverity, has_systemic_penalty: bool = False) -> datetime:
        """
        Нормативный срок устранения дефекта по типу и серьезности.
        Если подрядчик системный нарушитель - срок сокращается для оперативного контроля.
        """
        hours_map = {
            DefectSeverity.EMERGENCY: 24,
            DefectSeverity.HIGH: 48,
            DefectSeverity.MEDIUM: 120,   # 5 дней
            DefectSeverity.LOW: 240       # 10 дней
        }
        hours = hours_map.get(severity, 120)
        if has_systemic_penalty:
            hours = int(hours * 0.7)  # Сокращение срока на 30% при системном отставании

        return datetime.utcnow() + timedelta(hours=hours)

    @staticmethod
    def process_handover(defect: Defect, contractor_id: int) -> int:
        """
        Фиксация передачи дефекта подрядчику (целевое время < 5 минут / 300 секунд).
        """
        now = datetime.utcnow()
        defect.contractor_id = contractor_id
        defect.status = DefectStatus.ASSIGNED
        defect.assigned_to_contractor_at = now
        
        # Расчет длительности передачи
        if defect.reported_at:
            delta = now - defect.reported_at
            duration = int(delta.total_seconds())
        else:
            duration = 60
        
        defect.handover_duration_seconds = max(1, duration)
        return defect.handover_duration_seconds

    @staticmethod
    def check_and_escalate(
        defect: Defect,
        contractor: Optional[Contractor] = None
    ) -> Optional[EscalationLog]:
        """
        Проверка сроков и запуск правил эскалации с учетом системного статуса подрядчика.
        """
        now = datetime.utcnow()

        # Если дефект уже закрыт - эскалация не нужна
        if defect.status == DefectStatus.VERIFIED_CLOSED:
            defect.is_overdue = False
            return None

        # Проверка дедлайна
        if not defect.deadline_at:
            defect.deadline_at = EscalationEngine.calculate_deadline(
                defect.severity,
                has_systemic_penalty=bool(contractor and contractor.is_systemic_problem)
            )

        is_past_deadline = now > defect.deadline_at
        defect.is_overdue = is_past_deadline

        # Проверка сквозного системного риска
        is_contractor_delayed_on_objects = bool(
            contractor and (contractor.delayed_projects_count > 0 or contractor.is_systemic_problem)
        )
        if is_contractor_delayed_on_objects:
            defect.has_systemic_flag = True
            defect.systemic_note = (
                f"Подрядчик {contractor.name} имеет {contractor.delayed_projects_count} "
                f"отстающих объектов по реестру строительства/ремонта."
            )

        if not is_past_deadline:
            return None

        # Дефект просрочен! Определяем уровень эскалации
        prev_level = defect.escalation_level
        overdue_days = (now - defect.deadline_at).days

        new_level = prev_level
        notified_party = ""
        reason = ""

        # Правило 1: Системный подрядчик с просрочкой сразу прыгает на уровень 2 (Акимат / Управление)
        if is_contractor_delayed_on_objects and prev_level < 2:
            new_level = 2
            notified_party = "Руководитель Управления пассажирского транспорта и автомобильных дорог / Акимат"
            reason = (
                f"КРИТИЧЕСКАЯ ЭСКАЛАЦИЯ: Подрядчик '{contractor.name if contractor else 'Н/Д'}' "
                f"сорвал срок устранения дефекта {defect.code} на {overdue_days} дн., "
                f"одновременно отставая по объектам реестра инфраструктуры!"
            )
        elif prev_level == 0:
            # Обычный первый уровень эскалации
            new_level = 1
            notified_party = f"Директор подрядной организации ({contractor.director_name if contractor else 'Руководство'})"
            reason = f"Срыв нормативного срока устранения дефекта {defect.code} на {max(1, overdue_days)} дн."
        elif prev_level == 1 and overdue_days >= 2:
            # Второй уровень: эскалация в Управление дорог
            new_level = 2
            notified_party = "Руководитель Управления пассажирского транспорта и автомобильных дорог"
            reason = f"Повторный срыв дедлайна: дефект {defect.code} не устранен спустя 48 часов после первого предупреждения."

        if new_level > prev_level:
            defect.escalation_level = new_level
            defect.status = DefectStatus.ESCALATED
            
            log = EscalationLog(
                defect_id=defect.id,
                contractor_id=contractor.id if contractor else defect.contractor_id,
                previous_level=prev_level,
                new_level=new_level,
                reason=reason,
                triggered_at=now,
                notified_party=notified_party,
                is_systemic=is_contractor_delayed_on_objects
            )
            return log

        return None
