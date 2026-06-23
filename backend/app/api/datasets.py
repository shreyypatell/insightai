"""Dataset upload, listing, retrieval, and deletion endpoints."""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import User
from app.schemas.dataset import DatasetOut, DatasetListItem
from app.services import dataset_service
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])


@router.post("/upload", response_model=DatasetOut, status_code=201)
def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dataset_service.upload_dataset(db, current_user.id, file)


@router.get("", response_model=list[DatasetListItem])
def list_datasets(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dataset_service.list_datasets(db, current_user.id, search)


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dataset_service.get_dataset_or_404(db, dataset_id, current_user.id)


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset_service.delete_dataset(db, dataset_id, current_user.id)
