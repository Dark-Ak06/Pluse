from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "RegionControl - Инфраструктура и Дороги Области"
    API_V1_STR: str = "/api/v1"
    REGION_NAME: str = "Сарыарқа облысы"
    DEMO_BANNER_ACTIVE: bool = True

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./region_control.db")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-regioncontrol-akimat-gton-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Business thresholds
    LAG_PERCENT_THRESHOLD: float = 10.0  # Отставание факт от плана в п.п.
    FRESHNESS_DAYS_THRESHOLD: int = 14   # Дней без обновления статуса
    BUDGET_OVERRUN_THRESHOLD_PERCENT: float = 0.0  # Превышение бюджета %
    SLA_HANDOVER_TARGET_SECONDS: int = 300  # 5 минут целевое время передачи дефекта

    # AI / LLM
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")  # mock | openai | gemini
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "mock-analyst")

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
