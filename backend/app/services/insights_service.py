"""
Rule-based "AI Data Analyst".

This intentionally does NOT call any paid LLM API. Instead it applies a
set of statistical rules (correlation thresholds, class imbalance
checks, missing-data thresholds, model performance comparisons) and
turns the results into plain-English sentences. This is a common and
fully legitimate technique - lots of production BI tools (e.g. "smart
narratives") work exactly this way.
"""
import pandas as pd


def correlation_insights(corr: dict, threshold: float = 0.6) -> list[str]:
    insights = []
    columns = corr.get("columns", [])
    matrix = corr.get("matrix", [])
    seen = set()

    for i, col_a in enumerate(columns):
        for j, col_b in enumerate(columns):
            if i >= j:
                continue
            value = matrix[i][j]
            pair = tuple(sorted([col_a, col_b]))
            if abs(value) >= threshold and pair not in seen:
                seen.add(pair)
                direction = "positive" if value > 0 else "negative"
                strength = "strong" if abs(value) >= 0.8 else "moderate"
                insights.append(
                    f"'{col_a}' and '{col_b}' show a {strength} {direction} correlation (r = {value})."
                )
    return insights[:5]


def missing_data_insights(missing_values: dict, n_rows: int) -> list[str]:
    insights = []
    for col, count in missing_values.items():
        if n_rows == 0:
            continue
        pct = round((count / n_rows) * 100, 1)
        if pct >= 30:
            insights.append(f"Column '{col}' is missing {pct}% of its values - consider investigating its source.")
    return insights[:3]


def target_insights(target_analysis: dict | None, target_column: str) -> list[str]:
    if not target_analysis:
        return []

    insights = []
    if target_analysis["type"] == "categorical":
        balance = target_analysis["class_balance"]
        if balance:
            majority_class, majority_share = max(balance.items(), key=lambda kv: kv[1])
            if majority_share >= 0.75:
                insights.append(
                    f"Target '{target_column}' is imbalanced - '{majority_class}' makes up "
                    f"{round(majority_share * 100, 1)}% of records, which can bias model accuracy."
                )
    else:
        insights.append(
            f"Target '{target_column}' ranges from {target_analysis['min']} to {target_analysis['max']}, "
            f"with an average of {target_analysis['mean']}."
        )
    return insights


def model_insights(results: list[dict], problem_type: str) -> list[str]:
    if not results:
        return []

    metric_key = "f1_score" if problem_type == "classification" else "r2_score"
    sorted_results = sorted(results, key=lambda r: r["metrics"].get(metric_key, 0), reverse=True)
    best = sorted_results[0]
    worst = sorted_results[-1]

    insights = [
        f"'{best['algorithm']}' performed best with a {metric_key.replace('_', ' ')} of "
        f"{round(best['metrics'].get(metric_key, 0), 3)}."
    ]
    if len(sorted_results) > 1 and best["algorithm"] != worst["algorithm"]:
        gap = round(best["metrics"].get(metric_key, 0) - worst["metrics"].get(metric_key, 0), 3)
        if gap > 0.05:
            insights.append(
                f"There is a notable performance gap of {gap} between the best and weakest model - "
                f"the dataset may favor non-linear models like Random Forest or XGBoost."
            )
    return insights


def generate_dataset_insights(df: pd.DataFrame, eda_result: dict, target_column: str | None = None) -> list[str]:
    insights = []
    insights += correlation_insights(eda_result.get("correlations", {}))
    insights += missing_data_insights(
        {col: int(df[col].isna().sum()) for col in df.columns}, len(df)
    )
    if target_column:
        insights += target_insights(eda_result.get("target_analysis"), target_column)

    if not insights:
        insights.append("No strong correlations or data quality issues were detected - this dataset looks clean.")
    return insights
