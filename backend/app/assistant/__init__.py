from app.core.config import settings
from app.assistant.provider_base import BaseLLMProvider
from app.assistant.mock_provider import MockLLMProvider

def get_llm_provider() -> BaseLLMProvider:
    if settings.LLM_PROVIDER.lower() == "mock":
        return MockLLMProvider()
    # Real provider placeholder or fallback
    return MockLLMProvider()
