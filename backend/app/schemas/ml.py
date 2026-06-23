"""Request/response models for the model training & comparison endpoints."""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class TrainRequest(BaseModel):
    dataset_id: int
    target_column: str
    problem_type: Literal["classification", "regression"]
    # Optional: restrict training to a subset of the available algorithms
    algorithms: list[str] | None = None


class ModelResult(BaseModel):
    id: int
    algorithm: str
    problem_type: str
    target_column: str
    metrics: dict
    created_at: datetime

    class Config:
        from_attributes = True


class TrainResponse(BaseModel):
    dataset_id: int
    target_column: str
    problem_type: str
    results: list[ModelResult]
    best_model_id: int
    best_algorithm: str
    insights: list[str]
