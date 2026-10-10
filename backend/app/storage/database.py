"""Database module for SQLite storage and session management."""

import sqlite3
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# SQLite connection engine. check_same_thread=False allows FastAPI multi-threaded requests.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional database session context."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables.

    Placeholder for schema creation. When ORM models are registered with Base,
    Base.metadata.create_all(bind=engine) will create the schema.
    """
    Base.metadata.create_all(bind=engine)
