"""Data cleaning endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import User, Report
from app.schemas.dataset import CleaningSummary
from app.services import dataset_service
from app.services.cleaning_service import clean_dataframe
from app.utils.deps import get_current_user
from app.utils.file_utils import load_dataframe

router = APIRouter(prefix="/api/clean", tags=["Cleaning"])


@router.post("/{dataset_id}", response_model=CleaningSummary)
def clean_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = dataset_service.get_dataset_or_404(db, dataset_id, current_user.id)
    df = load_dataframe(dataset.file_path)
    _cleaned_df, summary = clean_dataframe(df)

    # Persist or update the report row for this dataset
    report = db.query(Report).filter(Report.dataset_id == dataset_id).first()
    if report:
        report.cleaning_summary = summary
    else:
        report = Report(dataset_id=dataset_id, cleaning_summary=summary)
        db.add(report)
    db.commit()

    return summary
