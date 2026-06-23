"""
Automatic data cleaning.

Performs the four steps required by the spec - missing value detection,
duplicate detection, basic missing value handling, and data type
correction - and returns both the cleaned DataFrame and a JSON-friendly
summary describing exactly what changed (used for the "cleaning report"
shown in the UI).
"""
import pandas as pd


def _try_correct_dtypes(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Attempt to convert object columns that are actually numeric or datetime."""
    corrected = []
    for col in df.columns:
        if df[col].dtype == "object":
            # Try numeric conversion first
            numeric_attempt = pd.to_numeric(df[col], errors="coerce")
            if numeric_attempt.notna().sum() >= 0.9 * df[col].notna().sum() and df[col].notna().sum() > 0:
                df[col] = numeric_attempt
                corrected.append(col)
                continue
            # Then try datetime conversion
            datetime_attempt = pd.to_datetime(df[col], errors="coerce")
            if datetime_attempt.notna().sum() >= 0.9 * df[col].notna().sum() and df[col].notna().sum() > 0:
                df[col] = datetime_attempt
                corrected.append(col)
    return df, corrected


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    rows_before = int(df.shape[0])
    missing_before = {col: int(df[col].isna().sum()) for col in df.columns}

    # 1. Duplicate detection & removal
    duplicate_count = int(df.duplicated().sum())
    df = df.drop_duplicates().reset_index(drop=True)

    # 2. Data type correction (numbers/dates stored as text)
    df, columns_type_corrected = _try_correct_dtypes(df)

    # 3. Basic missing value handling
    #    Numeric columns -> median, categorical columns -> mode (or "Unknown")
    for col in df.columns:
        if df[col].isna().sum() == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            mode = df[col].mode()
            df[col] = df[col].fillna(mode.iloc[0] if not mode.empty else "Unknown")

    missing_after = {col: int(df[col].isna().sum()) for col in df.columns}

    summary = {
        "rows_before": rows_before,
        "rows_after": int(df.shape[0]),
        "duplicates_removed": duplicate_count,
        "missing_values_before": missing_before,
        "missing_values_after": missing_after,
        "columns_type_corrected": columns_type_corrected,
    }
    return df, summary
