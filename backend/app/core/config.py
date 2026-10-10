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

    # Allowed CORS origins for development (e.g. Vite dev server)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
