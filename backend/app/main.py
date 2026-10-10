"""Main entry point for AgentBreak FastAPI backend application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router
from app.storage.database import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgentBreak: AI Agent Security Testing Platform API",
)

# CORS configuration for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes under /api
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def on_startup() -> None:
    """Initialize database and dependencies on startup."""
    init_db()


@app.get("/")
def root_redirect() -> dict:
    """Root endpoint info."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_health": f"{settings.API_V1_STR}/health",
    }
