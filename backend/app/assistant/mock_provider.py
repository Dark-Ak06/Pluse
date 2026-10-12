import re
from typing import Dict, Any
from app.assistant.provider_base import BaseLLMProvider
from app.models.defect import DefectType, DefectSeverity

DISCLAIMER = "\n\n⚠️ *Примечание: данная аналитическая подсказка сформирована ИИ-помощником. Окончательное решение принимает ответственный специалист акимата.*"

class MockLLMProvider(BaseLLMProvider):
    def generate_regional_summary(self, context_data: Dict[str, Any]) -> str:
        total_objects = context_data.get("total_objects", 127)
        delayed_objects = context_data.get("delayed_objects", 18)
        freshness_issues = context_data.get("freshness_issues", 14)
        total_defects = context_data.get("total_defects", 300)
        overdue_defects = context_data.get("overdue_defects", 24)
        problem_contractors = context_data.get("problem_contractors", ["ТОО «Сарыарқа Жол Құрылыс»", "ТОО «СтепьСтройСервис»"])
        inspected_km = context_data.get("inspected_km", 1412.0)
        total_km = context_data.get("total_km", 1588.0)
        coverage_pct = round((inspected_km / total_km) * 100, 1) if total_km else 88.9

        contractors_str = ", ".join(problem_contractors)

        summary = (
            f"**ЕЖЕДНЕВНАЯ СВОДКА ПО ИНФРАСТРУКТУРЕ И ДОРОГАМ ОБЛАСТИ**\n\n"
            f"📊 **Реестр объектов:** Всего в работе {total_objects} объектов. "
            f"Соблюдают график: {total_objects - delayed_objects} ({round((total_objects - delayed_objects)/total_objects*100, 1)}%). "
            f"В зоне критического отставания находится **{delayed_objects} объектов**, "
            f"у {freshness_issues} объектов статус не обновлялся более 14 дней.\n\n"
            f"🛣️ **Дорожная сеть:** Осмотрено **{inspected_km:,.0f} из {total_km:,.0f} км ({coverage_pct}%)** дорожной сети. "
            f"Зафиксировано {total_defects} дефектов, из них **{overdue_defects} с просроченным дедлайном**.\n\n"
            f"🚨 **Системные сбои подрядчиков:** Выявлены организации с одновременным срывом графиков строительства "
            f"и нормативов устранения дорожных ям: **{contractors_str}**.\n\n"
            f"🎯 **Рекомендация акиму:** Направить предписания и инициировать заседание региональной комиссии по контролю "
            f"госзакупок по указанным подрядчикам."
            f"{DISCLAIMER}"
        )
        return summary

    def classify_defect(self, text_description: str) -> Dict[str, Any]:
        text = text_description.lower()

        # Тип дефекта
        defect_type = DefectType.OTHER
        if any(w in text for w in ["яма", "выбоина", "колдобина", "провал"]):
            defect_type = DefectType.POTHOLE
        elif any(w in text for w in ["трещин", "колейност", "колея", "сетка"]):
            defect_type = DefectType.CRACK
        elif any(w in text for w in ["разметк", "зебра", "полоса", "линия"]):
            defect_type = DefectType.MARKINGS
        elif any(w in text for w in ["знак", "указател", "светофор"]):
            defect_type = DefectType.SIGNAGE
        elif any(w in text for w in ["огражден", "барьер", "отбойник", "перил"]):
            defect_type = DefectType.BARRIER

        # Серьезность
        severity = DefectSeverity.MEDIUM
        if any(w in text for w in ["авари", "опасн", "глубок", "провал", "срочн", "двойн"]):
            severity = DefectSeverity.EMERGENCY
        elif any(w in text for w in ["больш", "критич", "разбит", "поврежд"]):
            severity = DefectSeverity.HIGH
        elif any(w in text for w in ["мелк", "стерт", "незначительн", "потертост"]):
            severity = DefectSeverity.LOW

        confidence = 0.94 if defect_type != DefectType.OTHER else 0.70

        return {
            "defect_type": defect_type.value,
            "severity": severity.value,
            "confidence": confidence,
            "suggested_title": f"Дефект: {defect_type.value.capitalize()} ({severity.value})",
            "disclaimer": "Автоматическая подсказка ИИ. Проверьте перед отправкой."
        }

    def answer_query(self, query: str, context_data: Dict[str, Any]) -> str:
        q = query.lower()
        if "есил" in q or "есильск" in q or "есіл" in q:
            return (
                "📍 **По объектам в Есильском районе:**\n"
                "- Капитальный ремонт дороги КВ-03 (км 0 - км 24): **отставание 24.0 п.п.**, подрядчик ТОО «Сарыарқа Жол Құрылыс».\n"
                "- Строительство водопровода в с. Красивое: отставание 12.0 п.п. (просрочена веха 'Монтаж насосной станции').\n"
                "- Всего в районе 24 проекта, из них 3 в зоне риска."
                f"{DISCLAIMER}"
            )
        elif "сарыарк" in q or "сарыарқа" in q or "жол курылыс" in q or "құрылыс" in q:
            return (
                "⚠️ **Анализ подрядчика ТОО «Сарыарқа Жол Құрылыс» (БИН 180440012345):**\n"
                "- **Статус: СИСТЕМНЫЙ НАРУШИТЕЛЬ** (Дисциплина: 24.5 / 100 баллов).\n"
                "- Объекты реестра: 2 проекта, оба с отставанием (срыв сроков сдачи на 24 п.п.).\n"
                "- Дорожные дефекты: 14 активных дефектов на закрепленных участках, из них **8 просрочено** и эскалировано в Управление дорог.\n"
                "- Рекомендация: приостановка приемки актов до закрытия аварийных ям."
                f"{DISCLAIMER}"
            )
        elif "дефект" in q or "просроч" in q or "яма" in q:
            return (
                "🚨 **Просроченные дефекты дорожной сети:**\n"
                "- Всего просрочено: 24 дефекта на 12 участках дорог.\n"
                "- Наибольшая концентрация: трасса КВ-03 (участок км 0 - 24) и трасса КВ-07 (участок км 45 - 80).\n"
                "- Эскалировано на уровень акима: 6 аварийных дефектов."
                f"{DISCLAIMER}"
            )
        else:
            return (
                f"🔎 По вашему запросу «{query}» найдено 4 связанных инфраструктурных проекта и 7 дорожных дефектов. "
                f"Рекомендуем применить фильтр в реестре объектов или перейти на единую карту."
                f"{DISCLAIMER}"
            )
