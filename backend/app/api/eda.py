"""Exploratory Data Analysis endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import User, Report
from app.schemas.dataset import EDAResult
from app.services import dataset_service
from app.services.cleaning_service import clean_dataframe
from app.services.eda_service import run_eda
from app.services.insights_service import generate_dataset_insights
from app.utils.deps import get_current_user
from app.utils.file_utils import load_dataframe

router = APIRouter(prefix="/api/eda", tags=["EDA"])


@router.get("/{dataset_id}", response_model=EDAResult)
def get_eda(
    dataset_id: int,
    target_column: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = dataset_service.get_dataset_or_404(db, dataset_id, current_user.id)
    df = load_dataframe(dataset.file_path)

    # Always clean before EDA so statistics are based on clean data
    cleaned_df, _summary = clean_dataframe(df)
    eda_result = run_eda(cleaned_df, target_column)
    insights = generate_dataset_insights(cleaned_df, eda_result, target_column)

    # Upsert into report table
    report = db.query(Report).filter(Report.dataset_id == dataset_id).first()
    if report:
        report.eda_summary = eda_result
        report.insights = insights
    else:
        report = Report(dataset_id=dataset_id, eda_summary=eda_result, insights=insights)
        db.add(report)
    db.commit()

    return eda_result
