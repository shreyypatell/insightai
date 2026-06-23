"""File system helpers for handling uploaded CSV/Excel files."""
import os
import uuid

import pandas as pd
from fastapi import UploadFile, HTTPException

from app.config import settings

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def save_upload(file: UploadFile) -> tuple[str, str]:
    """Persist an uploaded file to disk with a unique name. Returns (saved_path, original_filename)."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Use CSV or Excel.")

    os.makedirs(settings.upload_dir, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.upload_dir, unique_name)

    with open(saved_path, "wb") as out_file:
        out_file.write(file.file.read())

    return saved_path, file.filename


def load_dataframe(file_path: str) -> pd.DataFrame:
    """Load a CSV or Excel file from disk into a pandas DataFrame."""
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".csv":
            return pd.read_csv(file_path)
        return pd.read_excel(file_path)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}")
