"""Core configuration module for AgentBreak backend."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or sensible defaults."""

    PROJECT_NAME: str = "AgentBreak"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # SQLite Database connection URL
    DATABASE_URL: str = "sqlite:///./agentbreak.db"

    # Optional Phase 2 model configuration. Keep credentials server-side only.
    AGENTBREAK_LLM_PROVIDER: str = "gemini"
    AGENTBREAK_LLM_MODEL: str = "gemini-3.5-flash-lite"
    AGENTBREAK_LLM_API_KEY: str = ""
    AGENTBREAK_LLM_TIMEOUT_SECONDS: int = 25

    # Allowed CORS origins for development (e.g. Vite dev and preview servers)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
