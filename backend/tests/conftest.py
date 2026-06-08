"""
pytest fixtures — SQLite in-memory database for fast, isolated unit tests.
No PostgreSQL required; all models use portable SQLAlchemy column types.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest")
os.environ.setdefault("ENVIRONMENT", "development")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models so metadata is populated before create_all
import app.models  # noqa: F401
from app.models.base import Base


@pytest.fixture(scope="function")
def db():
    """Provide a fresh in-memory SQLite session for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
        engine.dispose()
