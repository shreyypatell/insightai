"""
Shared preprocessing for every model we train.
"""
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from fastapi import HTTPException


def split_features_target(df, target_column):
    if target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{target_column}' not found in dataset")
    df = df.dropna(subset=[target_column])
    X = df.drop(columns=[target_column])
    y = df[target_column]
    return X, y


def build_preprocessor(X):
    numeric_cols = X.select_dtypes(include="number").columns.tolist()
    categorical_cols = X.select_dtypes(exclude="number").columns.tolist()
    numeric_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer(transformers=[
        ("numeric", numeric_pipeline, numeric_cols),
        ("categorical", categorical_pipeline, categorical_cols),
    ])


def prepare_training_data(df, target_column, problem_type):
    X, y = split_features_target(df, target_column)

    if problem_type == "regression" and not pd.api.types.is_numeric_dtype(y):
        coerced = pd.to_numeric(y, errors="coerce")
        if coerced.notna().sum() == 0:
            sample_values = y.dropna().unique()[:5].tolist()
            raise HTTPException(status_code=400, detail=(
                f"Target column '{target_column}' contains non-numeric values "
                f"(e.g. {sample_values}) and cannot be used for Regression. "
                "Pick a numeric column, or switch Problem Type to Classification."
            ))
        valid_mask = coerced.notna()
        X = X[valid_mask]
        y = coerced[valid_mask]

    MIN_ROWS = 30
    if len(X) < MIN_ROWS:
        raise HTTPException(status_code=400, detail=(
            f"Dataset has only {len(X)} usable rows after cleaning. "
            f"Need at least {MIN_ROWS} rows to train reliably. "
            "Upload a larger dataset."
        ))

    label_encoder = None
    if problem_type == "classification":
        label_encoder = LabelEncoder()
        if pd.api.types.is_numeric_dtype(y):
            y = label_encoder.fit_transform(y)
        else:
            y = label_encoder.fit_transform(y.astype(str))

    can_stratify = False
    if problem_type == "classification":
        class_counts = pd.Series(y).value_counts()
        can_stratify = bool(len(class_counts) > 1 and class_counts.min() >= 2)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42,
        stratify=y if can_stratify else None,
    )

    # Re-encode on training labels only so XGBoost's internal class list
    # exactly matches what it was trained on — prevents "Invalid classes" error
    if problem_type == "classification":
        train_encoder = LabelEncoder()
        y_train = train_encoder.fit_transform(y_train)
        mapping = {cls: idx for idx, cls in enumerate(train_encoder.classes_)}
        y_test = np.array([mapping.get(lbl, -1) for lbl in y_test])
        label_encoder = train_encoder

    preprocessor = build_preprocessor(X)
    return X_train, X_test, y_train, y_test, preprocessor, label_encoder