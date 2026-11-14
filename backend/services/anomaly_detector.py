from math import isfinite, sqrt

from models.analytics import AnomalyResult, MetricName
from services.prediction_engine import METRIC_DEFINITIONS


def detect_anomaly(
    history: list[dict],
    metric: MetricName,
    window: int = 8,
    minimum_observations: int = 3,
    z_threshold: float = 2.0,
) -> AnomalyResult:
    values = [
        float(item[metric])
        for item in history
        if isinstance(item.get(metric), (int, float)) and isfinite(item[metric])
    ]
    if len(values) < minimum_observations:
        return AnomalyResult(
            metric=metric,
            status="insufficient_data",
            window=window,
            observations=len(values),
            explanation=f"At least {minimum_observations} valid observations are required.",
        )

    recent = values[-window:]
    current = recent[-1]
    baseline = recent[:-1] or recent
    mean = sum(baseline) / len(baseline)
    variance = sum((value - mean) ** 2 for value in baseline) / len(baseline)
    standard_deviation = sqrt(variance)
    if standard_deviation < 1e-9:
        return AnomalyResult(
            metric=metric,
            status="normal",
            observed_value=round(current, 2),
            rolling_mean=round(mean, 2),
            rolling_std=0.0,
            window=window,
            observations=len(values),
            explanation="The reference window has near-zero variance; no statistical outlier is asserted.",
        )

    is_anomaly = abs(current - mean) / standard_deviation >= z_threshold
    return AnomalyResult(
        metric=metric,
        status="anomaly" if is_anomaly else "normal",
        observed_value=round(current, 2),
        rolling_mean=round(mean, 2),
        rolling_std=round(standard_deviation, 2),
        window=window,
        observations=len(values),
        explanation=(
            f"The latest value is {'outside' if is_anomaly else 'within'} the rolling statistical range. "
            "A statistical anomaly is not a medical diagnosis."
        ),
    )


def detect_all(history: list[dict]) -> list[AnomalyResult]:
    return [detect_anomaly(history, metric) for metric in METRIC_DEFINITIONS]
