"""
Database connection setup.

Uses SQLAlchemy's engine/session pattern. With SQLite this needs the
`check_same_thread=False` connect arg because FastAPI can use a request
in a different thread than the one that created the connection.
Swapping to Postgres later only means changing DATABASE_URL - no other
code changes are required.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
