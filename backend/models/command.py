from typing import Literal

from pydantic import BaseModel, Field

EmergencyScenarioId = Literal[
    "sleep_deprivation",
    "elevated_workload",
    "isolation_stress",
    "elevated_radiation_environment",
    "communication_delay",
    "habitat_environmental_warning",
]


class ActivateScenarioRequest(BaseModel):
    scenario_id: EmergencyScenarioId


class ResponseRequest(BaseModel):
    action_id: str = Field(min_length=1, max_length=80)


class MessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=240)


class CommandMessage(BaseModel):
    id: str
    text: str
    sender: Literal["earth_mission_control", "spacecraft"]
    sent_at_mission_hour: float
    delivery_at_mission_hour: float
    delivered: bool
    delivered_at_mission_hour: float | None = None
