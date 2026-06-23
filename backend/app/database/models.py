"""
ORM models for InsightAI.

Four tables, matching the spec:
  - User:    account used to log in
  - Dataset: an uploaded CSV/Excel file and its metadata
  - MLModel: a trained model tied to a dataset, with its metrics
  - Report:  cleaning + EDA + insight results for a dataset

Relationships are defined so that deleting a dataset cascades to its
models and reports - this keeps storage and DB rows from going stale.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Metadata captured right after upload
    n_rows = Column(Integer, default=0)
    n_columns = Column(Integer, default=0)
    columns = Column(JSON, default=list)        # list of column names
    dtypes = Column(JSON, default=dict)          # {column: dtype}
    missing_values = Column(JSON, default=dict)  # {column: missing count}

    owner = relationship("User", back_populates="datasets")
    models = relationship("MLModel", back_populates="dataset", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="dataset", cascade="all, delete-orphan")


class MLModel(Base):
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    problem_type = Column(String, nullable=False)   # "classification" | "regression"
    algorithm = Column(String, nullable=False)       # e.g. "random_forest"
    target_column = Column(String, nullable=False)
    metrics = Column(JSON, default=dict)              # accuracy, f1, r2, etc.
    file_path = Column(String, nullable=False)        # joblib .pkl location
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="models")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    cleaning_summary = Column(JSON, default=dict)
    eda_summary = Column(JSON, default=dict)
    insights = Column(JSON, default=list)   # list of human-readable strings
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="reports")
