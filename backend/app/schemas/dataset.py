"""Request/response models for dataset upload and metadata endpoints."""
from datetime import datetime
from pydantic import BaseModel


class DatasetOut(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    n_rows: int
    n_columns: int
    columns: list[str]
    dtypes: dict
    missing_values: dict

    class Config:
        from_attributes = True


class DatasetListItem(BaseModel):
    """Lighter payload used for list views (no column-level detail)."""
    id: int
    filename: str
    uploaded_at: datetime
    n_rows: int
    n_columns: int

    class Config:
        from_attributes = True


class CleaningSummary(BaseModel):
    duplicates_removed: int
    missing_values_before: dict
    missing_values_after: dict
    columns_type_corrected: list[str]
    rows_before: int
    rows_after: int


class EDAResult(BaseModel):
    summary_statistics: dict
    correlations: dict
    column_distributions: dict
    target_analysis: dict | None = None
