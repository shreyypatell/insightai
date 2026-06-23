"""
Exploratory Data Analysis (EDA).

Produces JSON-serialisable summaries that the frontend turns into charts
with Recharts - no image rendering happens on the backend, which keeps
the API fast and the frontend in full control of styling.
"""
import numpy as np
import pandas as pd


def summary_statistics(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=np.number)
    if numeric_df.empty:
        return {}
    described = numeric_df.describe().to_dict()
    # Round for cleaner display
    return {
        col: {stat: round(float(val), 4) for stat, val in stats.items()}
        for col, stats in described.items()
    }


def column_distributions(df: pd.DataFrame, max_categories: int = 12) -> dict:
    """For numeric columns: histogram bins. For categorical columns: value counts."""
    distributions = {}
    for col in df.columns:
        series = df[col].dropna()
        if series.empty:
            continue
        if pd.api.types.is_numeric_dtype(series):
            counts, bin_edges = np.histogram(series, bins=10)
            distributions[col] = {
                "type": "numeric",
                "bins": [round(float(edge), 2) for edge in bin_edges],
                "counts": [int(c) for c in counts],
            }
        else:
            value_counts = series.astype(str).value_counts().head(max_categories)
            distributions[col] = {
                "type": "categorical",
                "categories": value_counts.index.tolist(),
                "counts": [int(c) for c in value_counts.values],
            }
    return distributions


def correlation_analysis(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=np.number)
    if numeric_df.shape[1] < 2:
        return {"columns": [], "matrix": []}
    corr = numeric_df.corr().round(3).fillna(0)
    return {
        "columns": corr.columns.tolist(),
        "matrix": corr.values.tolist(),
    }


def target_variable_analysis(df: pd.DataFrame, target_column: str | None) -> dict | None:
    if not target_column or target_column not in df.columns:
        return None

    target = df[target_column].dropna()
    if target.empty:
        return None

    if pd.api.types.is_numeric_dtype(target):
        return {
            "type": "numeric",
            "mean": round(float(target.mean()), 4),
            "median": round(float(target.median()), 4),
            "std": round(float(target.std()), 4),
            "min": round(float(target.min()), 4),
            "max": round(float(target.max()), 4),
        }

    value_counts = target.astype(str).value_counts()
    return {
        "type": "categorical",
        "classes": value_counts.index.tolist(),
        "counts": [int(c) for c in value_counts.values],
        "class_balance": {
            cls: round(float(count) / len(target), 4)
            for cls, count in value_counts.items()
        },
    }


def run_eda(df: pd.DataFrame, target_column: str | None = None) -> dict:
    return {
        "summary_statistics": summary_statistics(df),
        "column_distributions": column_distributions(df),
        "correlations": correlation_analysis(df),
        "target_analysis": target_variable_analysis(df, target_column),
    }
