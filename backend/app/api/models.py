"""ML model training, results, comparison, and download endpoints."""
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.database.models import User, MLModel, Report
from app.ml.trainer import train_all_models, pick_best_model
from app.schemas.ml import TrainRequest, TrainResponse, ModelResult
from app.services import dataset_service
from app.services.cleaning_service import clean_dataframe
from app.services.insights_service import model_insights
from app.utils.deps import get_current_user
from app.utils.file_utils import load_dataframe

router = APIRouter(prefix="/api/models", tags=["Models"])


@router.post("/train", response_model=TrainResponse)
def train_models(
    payload: TrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = dataset_service.get_dataset_or_404(db, payload.dataset_id, current_user.id)
    df = load_dataframe(dataset.file_path)
    cleaned_df, _ = clean_dataframe(df)

    try:
        raw_results = train_all_models(
            cleaned_df, payload.target_column, payload.problem_type, payload.algorithms
        )
    except HTTPException:
        raise 
    except Exception as exc:

        raise HTTPException(status_code=400, detail=f"Training failed: {exc}")

    saved_models = []
    for r in raw_results:
        model_row = MLModel(
            dataset_id=payload.dataset_id,
            problem_type=payload.problem_type,
            algorithm=r["algorithm"],
            target_column=payload.target_column,
            metrics=r["metrics"],
            file_path=r["file_path"],
        )
        db.add(model_row)
        db.flush()  # get the id without committing
        saved_models.append(model_row)

    db.commit()
    for m in saved_models:
        db.refresh(m)

    best_raw = pick_best_model(raw_results, payload.problem_type)
    best_row = next(m for m in saved_models if m.algorithm == best_raw["algorithm"])

    insights = model_insights(raw_results, payload.problem_type)

    # Attach model insights to the existing report
    report = db.query(Report).filter(Report.dataset_id == payload.dataset_id).first()
    if report:
        existing_insights = list(report.insights or [])
        existing_insights.extend(insights)
        report.insights = existing_insights
        db.commit()

    return TrainResponse(
        dataset_id=payload.dataset_id,
        target_column=payload.target_column,
        problem_type=payload.problem_type,
        results=[ModelResult.model_validate(m) for m in saved_models],
        best_model_id=best_row.id,
        best_algorithm=best_row.algorithm,
        insights=insights,
    )


@router.get("/dataset/{dataset_id}", response_model=list[ModelResult])
def get_models_for_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset_service.get_dataset_or_404(db, dataset_id, current_user.id)
    return db.query(MLModel).filter(MLModel.dataset_id == dataset_id).all()


@router.get("/{model_id}/results", response_model=ModelResult)
def get_model_result(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    dataset_service.get_dataset_or_404(db, model.dataset_id, current_user.id)
    return model


@router.get("/{model_id}/download")
def download_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    dataset_service.get_dataset_or_404(db, model.dataset_id, current_user.id)
    if not os.path.exists(model.file_path):
        raise HTTPException(status_code=404, detail="Model file not found on disk")

    filename = f"{model.algorithm}_{model.problem_type}.pkl"
    return FileResponse(model.file_path, media_type="application/octet-stream", filename=filename)
