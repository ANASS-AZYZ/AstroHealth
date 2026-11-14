from pydantic import BaseModel, Field


class DemoAdvanceRequest(BaseModel):
    steps: int = Field(default=1, ge=-8, le=8)


class DemoState(BaseModel):
    active: bool
    preset_name: str
    seed: int
    current_step: int
    total_steps: int
    step: dict
    steps: list[dict]
    mission: dict
    alert_count: int
    response_available: bool
