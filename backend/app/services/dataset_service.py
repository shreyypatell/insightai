"""Business logic for dataset upload, metadata extraction, and management."""
import os

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.models import Dataset
from app.utils.file_utils import save_upload, load_dataframe


def extract_metadata(df) -> dict:
    """Compute the metadata block shown on the dataset card / detail page."""
    return {
        "n_rows": int(df.shape[0]),
        "n_columns": int(df.shape[1]),
        "columns": list(df.columns.astype(str)),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_values": {col: int(df[col].isna().sum()) for col in df.columns},
    }


def upload_dataset(db: Session, owner_id: int, file: UploadFile) -> Dataset:
    saved_path, original_name = save_upload(file)
    df = load_dataframe(saved_path)

    if df.empty:
        os.remove(saved_path)
        raise HTTPException(status_code=400, detail="Uploaded file contains no data")

    metadata = extract_metadata(df)

    dataset = Dataset(
        owner_id=owner_id,
        filename=original_name,
        file_path=saved_path,
        **metadata,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


def list_datasets(db: Session, owner_id: int, search: str | None = None) -> list[Dataset]:
    query = db.query(Dataset).filter(Dataset.owner_id == owner_id)
    if search:
        query = query.filter(Dataset.filename.ilike(f"%{search}%"))
    return query.order_by(Dataset.uploaded_at.desc()).all()


def get_dataset_or_404(db: Session, dataset_id: int, owner_id: int) -> Dataset:
    dataset = (
        db.query(Dataset)
        .filter(Dataset.id == dataset_id, Dataset.owner_id == owner_id)
        .first()
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


def delete_dataset(db: Session, dataset_id: int, owner_id: int) -> None:
    dataset = get_dataset_or_404(db, dataset_id, owner_id)
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
    db.delete(dataset)
    db.commit()
