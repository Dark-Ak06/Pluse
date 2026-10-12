from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseIntegrationAdapter(ABC):
    @property
    @abstractmethod
    def system_name(self) -> str:
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        pass
