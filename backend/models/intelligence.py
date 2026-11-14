from typing import Literal

from pydantic import BaseModel, Field

from models.mission import ScenarioName


class MissionEvent(BaseModel):
    id: str
    event_type: str
    description: str
    mission_timestamp: float
    recorded_at: str
    scenario: ScenarioName
    metric: str | None = None


class ScenarioComparisonRequest(BaseModel):
    scenario_a: ScenarioName
    scenario_b: ScenarioName
    ticks: int = Field(default=12, ge=1, le=100)


class ComparisonMetric(BaseModel):
    metric: str
    unit: str
    scenario_a: float
    scenario_b: float
    absolute_difference: float
    percentage_difference: float | None = None


class ScenarioComparison(BaseModel):
    scenario_a: dict
    scenario_b: dict
    seed: int
    ticks: int
    metrics: list[ComparisonMetric]
    series: list[dict]
    explanation: str


class ReadinessScore(BaseModel):
    score: int = Field(ge=0, le=100)
    category: Literal["Nominal", "Attention", "Review Required"]
    formula: str
    weights: dict[str, float]
    inputs: dict[str, float]
    missing_data_behavior: str
    limitations: list[str]
