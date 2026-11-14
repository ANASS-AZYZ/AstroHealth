from datetime import datetime, timezone
from math import isfinite

from models.analytics import MetricName, Prediction


METRIC_DEFINITIONS: dict[MetricName, dict[str, str]] = {
    "heart_rate": {"unit": "BPM", "label": "Heart rate"},
    "oxygen_saturation": {"unit": "%", "label": "Oxygen saturation"},
    "fatigue_index": {"unit": "index (0-100)", "label": "Fatigue index"},
    "stress_index": {"unit": "index (0-100)", "label": "Stress index"},
    "sleep_hours": {"unit": "hours", "label": "Sleep duration"},
}


def _values(history: list[dict], metric: MetricName) -> list[float]:
    values = []
    for measurement in history:
        value = measurement.get(metric)
        if isinstance(value, (int, float)) and isfinite(value):
            values.append(float(value))
    return values


def predict_metric(
    history: list[dict],
    metric: MetricName,
    horizon: int = 3,
    window: int = 8,
) -> Prediction:
    values = _values(history, metric)
    definition = METRIC_DEFINITIONS[metric]
    generated_at = datetime.now(timezone.utc).isoformat()
    if len(values) < 3:
        return Prediction(
            metric=metric,
            unit=definition["unit"],
            status="insufficient_data",
            forecast_horizon=f"next {horizon} simulation ticks",
            method="linear trend over a moving window",
            observations=len(values),
            data_quality="insufficient",
            explanation="At least 3 valid observations are required; no prediction was fabricated.",
            generated_at=generated_at,
        )

    recent = values[-window:]
    average = sum(recent) / len(recent)
    if len(recent) > 1:
        x_mean = (len(recent) - 1) / 2
        numerator = sum((index - x_mean) * (value - average) for index, value in enumerate(recent))
        denominator = sum((index - x_mean) ** 2 for index in range(len(recent)))
        slope = numerator / denominator if denominator else 0.0
    else:
        slope = 0.0
    predicted = recent[-1] + slope * horizon
    return Prediction(
        metric=metric,
        unit=definition["unit"],
        status="ready",
        predicted_value=round(predicted, 2),
        forecast_horizon=f"next {horizon} simulation ticks",
        method=f"moving average ({len(recent)}) + linear trend",
        observations=len(values),
        data_quality="good" if len(values) >= window else "limited",
        explanation=(
            f"Estimated from the latest {len(recent)} valid observations. "
            "This is an experimental statistical trend, not a clinical forecast."
        ),
        generated_at=generated_at,
    )


def predict_all(history: list[dict]) -> list[Prediction]:
    return [predict_metric(history, metric) for metric in METRIC_DEFINITIONS]
