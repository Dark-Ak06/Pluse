from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_regional_summary(self, context_data: Dict[str, Any]) -> str:
        """Генерация текстовой аналитической сводки для Акима."""
        pass

    @abstractmethod
    def classify_defect(self, text_description: str) -> Dict[str, Any]:
        """Автоклассификация типа и серьезности дефекта по тексту."""
        pass

    @abstractmethod
    def answer_query(self, query: str, context_data: Dict[str, Any]) -> str:
        """Ответ на поисковый запрос на естественном языке."""
        pass
