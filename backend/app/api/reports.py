"""Report and insights retrieval endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import User, Report
from app.services import dataset_service
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/{dataset_id}")
def get_report(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset_service.get_dataset_or_404(db, dataset_id, current_user.id)
    report = db.query(Report).filter(Report.dataset_id == dataset_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="No report found for this dataset. Run EDA first.")
    return {
        "id": report.id,
        "dataset_id": report.dataset_id,
        "cleaning_summary": report.cleaning_summary,
        "eda_summary": report.eda_summary,
        "insights": report.insights,
        "created_at": report.created_at,
    }


@router.delete("/{dataset_id}", status_code=204)
def delete_report(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset_service.get_dataset_or_404(db, dataset_id, current_user.id)
    report = db.query(Report).filter(Report.dataset_id == dataset_id).first()
    if report:
        db.delete(report)
        db.commit()
