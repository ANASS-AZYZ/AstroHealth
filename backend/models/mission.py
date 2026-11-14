from typing import Literal

from pydantic import BaseModel, Field


MissionPhase = Literal[
    "pre_launch",
    "launch",
    "deep_space_transit",
    "mars_arrival",
    "mars_surface",
    "return_transit",
    "earth_return",
]

ScenarioName = Literal[
    "nominal",
    "sleep_disruption",
    "elevated_workload",
    "isolation_stress",
    "elevated_radiation",
    "eva_activity",
]

SimulationStatus = Literal["idle", "running", "paused"]


class ScenarioRequest(BaseModel):
    scenario: ScenarioName


class PhaseRequest(BaseModel):
    phase: MissionPhase


class SpeedRequest(BaseModel):
    speed: Literal[1, 5, 10, 50]


class AdvanceRequest(BaseModel):
    ticks: int = Field(default=1, ge=1, le=100)


class HealthMeasurement(BaseModel):
    heart_rate: float = Field(ge=40, le=180)
    oxygen_saturation: float = Field(ge=80, le=100)
    sleep_hours: float = Field(ge=0, le=14)
    stress_index: float = Field(ge=0, le=100)
    fatigue_index: float = Field(ge=0, le=100)
    workload_index: float = Field(ge=0, le=100)
    radiation_dose_rate: float = Field(ge=0, le=5)
    timestamp: str
    data_type: Literal["simulated"] = "simulated"


class MissionState(BaseModel):
    status: SimulationStatus
    phase: MissionPhase
    scenario: ScenarioName
    speed: Literal[1, 5, 10, 50]
    seed: int
    tick: int
    elapsed_hours: float = Field(ge=0)
    mission_day: float = Field(ge=0)
    active_stressors: list[str]
    environmental_conditions: list[str]
    health: HealthMeasurement
    alerts: list[dict]
    last_updated: str


class ScenarioSummary(BaseModel):
    id: ScenarioName
    name: str
    description: str
    active_phases: list[MissionPhase]
    environmental_conditions: list[str]
    expected_effects: list[str]
    assumptions: list[str]


class DigitalTwin(BaseModel):
    astronaut: dict
    status: Literal["nominal", "attention", "high_priority"]
    status_explanation: str
    mission: MissionState
