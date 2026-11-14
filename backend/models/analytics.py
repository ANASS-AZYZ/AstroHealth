from typing import Literal

from pydantic import BaseModel, Field


MetricName = Literal[
    "heart_rate",
    "oxygen_saturation",
    "fatigue_index",
    "stress_index",
    "sleep_hours",
]


class Prediction(BaseModel):
    metric: MetricName
    unit: str
    status: Literal["ready", "insufficient_data"]
    predicted_value: float | None = None
    forecast_horizon: str
    method: str
    observations: int
    data_quality: Literal["good", "limited", "insufficient"]
    explanation: str
    generated_at: str


class AnomalyResult(BaseModel):
    metric: MetricName
    status: Literal["normal", "anomaly", "insufficient_data"]
    observed_value: float | None = None
    rolling_mean: float | None = None
    rolling_std: float | None = None
    window: int
    observations: int
    explanation: str


class AlertResponse(BaseModel):
    id: str
    metric: str
    observed_value: float
    unit: str
    rule: str
    threshold: float
    severity: Literal["INFO", "ATTENTION", "HIGH PRIORITY"]
    timestamp: str
    explanation: str
    suggested_follow_up: str
    acknowledged: bool = False


class AnalyticsSummary(BaseModel):
    mission_day: float
    scenario: str
    phase: str
    observations: int
    predictions: list[Prediction]
    anomalies: list[AnomalyResult]
    alerts: list[AlertResponse]
    data_quality: Literal["good", "limited", "insufficient"]
    disclaimer: str


class InsightsResponse(BaseModel):
    title: str
    summary: str
    factors: list[str]
    limitations: list[str]
    current_indicators: dict[str, float | str]
    data_type: str
