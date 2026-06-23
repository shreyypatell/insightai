"""
Model training & evaluation.

Trains every requested algorithm inside an identical preprocessing +
estimator Pipeline, scores it with the metrics required by the spec,
and saves the fitted pipeline to disk with joblib so it can be
downloaded and re-used for inference later.
"""
import os
import uuid

import numpy as np
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    r2_score, mean_absolute_error, mean_squared_error,
)
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier, XGBRegressor
import joblib

from app.config import settings
from app.ml.preprocessing import prepare_training_data

CLASSIFICATION_ALGORITHMS = {
    "logistic_regression": LogisticRegression(max_iter=1000),
    "random_forest": RandomForestClassifier(n_estimators=150, random_state=42),
    "xgboost": XGBClassifier(eval_metric="logloss", random_state=42),
}

REGRESSION_ALGORITHMS = {
    "linear_regression": LinearRegression(),
    "random_forest": RandomForestRegressor(n_estimators=150, random_state=42),
    "xgboost": XGBRegressor(random_state=42),
}


def _evaluate_classification(y_test, y_pred) -> dict:
    return {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }


def _evaluate_regression(y_test, y_pred) -> dict:
    mse = mean_squared_error(y_test, y_pred)
    return {
        "r2_score": round(float(r2_score(y_test, y_pred)), 4),
        "mae": round(float(mean_absolute_error(y_test, y_pred)), 4),
        "rmse": round(float(np.sqrt(mse)), 4),
    }


def train_all_models(df, target_column: str, problem_type: str, algorithms: list[str] | None = None):
    """
    Trains every selected algorithm for the given problem type and
    returns a list of dicts: {algorithm, metrics, file_path}.
    """
    algo_registry = CLASSIFICATION_ALGORITHMS if problem_type == "classification" else REGRESSION_ALGORITHMS
    selected = {k: v for k, v in algo_registry.items() if not algorithms or k in algorithms} or algo_registry

    X_train, X_test, y_train, y_test, preprocessor, label_encoder = prepare_training_data(
        df, target_column, problem_type
    )

    os.makedirs(settings.model_dir, exist_ok=True)
    results = []

    for algo_name, estimator in selected.items():
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", estimator)])
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)

        metrics = (
            _evaluate_classification(y_test, y_pred)
            if problem_type == "classification"
            else _evaluate_regression(y_test, y_pred)
        )

        file_name = f"{uuid.uuid4().hex}_{algo_name}.pkl"
        file_path = os.path.join(settings.model_dir, file_name)
        joblib.dump({"pipeline": pipeline, "label_encoder": label_encoder}, file_path)

        results.append({
            "algorithm": algo_name,
            "metrics": metrics,
            "file_path": file_path,
        })

    return results


def pick_best_model(results: list[dict], problem_type: str) -> dict:
    metric_key = "f1_score" if problem_type == "classification" else "r2_score"
    return max(results, key=lambda r: r["metrics"].get(metric_key, float("-inf")))
