from typing import Any, Dict, List
from app.integrations.base import BaseIntegrationAdapter

class GoszakupAdapter(BaseIntegrationAdapter):
    """Адаптер интеграции с Порталом Государственных Закупок РК (goszakup.gov.kz)."""
    @property
    def system_name(self) -> str:
        return "Портал Госзакупок РК"

    def health_check(self) -> Dict[str, Any]:
        return {"status": "connected", "system": self.system_name, "mode": "stub"}

    def sync_contract(self, contract_number: str) -> Dict[str, Any]:
        return {
            "contract_number": contract_number,
            "status": "ACTIVE",
            "source": "goszakup_api_mock"
        }

class GisAdapter(BaseIntegrationAdapter):
    """Адаптер Национальной ГИС и КазАвтоЖол."""
    @property
    def system_name(self) -> str:
        return "Национальная ГИС / КазАвтоЖол"

    def health_check(self) -> Dict[str, Any]:
        return {"status": "connected", "system": self.system_name, "mode": "stub"}

class OneCAdapter(BaseIntegrationAdapter):
    """Адаптер 1С:Предприятие (кассовые выплаты, акты выполненных работ)."""
    @property
    def system_name(self) -> str:
        return "1С:Предприятие (Казначейство и Бухгалтерия)"

    def health_check(self) -> Dict[str, Any]:
        return {"status": "connected", "system": self.system_name, "mode": "stub"}

class EdoAdapter(BaseIntegrationAdapter):
    """Адаптер Единой Системы Электронного Документооборота (ЕСЭДО)."""
    @property
    def system_name(self) -> str:
        return "ЕСЭДО (Документооборот Акимата)"

    def health_check(self) -> Dict[str, Any]:
        return {"status": "connected", "system": self.system_name, "mode": "stub"}

class NotificationAdapter(BaseIntegrationAdapter):
    """Адаптер оповещений подрядчиков через WhatsApp / Telegram / SMS."""
    @property
    def system_name(self) -> str:
        return "Шлюз оповещений (WhatsApp / Telegram / SMS)"

    def health_check(self) -> Dict[str, Any]:
        return {"status": "connected", "system": self.system_name, "mode": "stub"}

    def send_defect_alert(self, phone: str, defect_code: str, deadline_str: str) -> Dict[str, Any]:
        return {
            "status": "SENT",
            "channel": "WhatsApp",
            "recipient": phone,
            "message": f"Новый дефект {defect_code} на вашем участке. Срок устранения: {deadline_str}"
        }
