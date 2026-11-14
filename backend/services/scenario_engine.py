from dataclasses import dataclass

from models.mission import MissionPhase, ScenarioName


PHASES: list[dict] = [
    {"id": "pre_launch", "name": "Pre-Launch", "description": "Baseline preparation and systems checkout."},
    {"id": "launch", "name": "Launch", "description": "Illustrative elevated workload during ascent."},
    {"id": "deep_space_transit", "name": "Deep Space Transit", "description": "Extended transit, isolation, and microgravity assumptions."},
    {"id": "mars_arrival", "name": "Mars Arrival", "description": "Transition and adaptation activities near Mars."},
    {"id": "mars_surface", "name": "Mars Surface Operations", "description": "Habitat operations and illustrative EVA workload."},
    {"id": "return_transit", "name": "Return Transit", "description": "Long-duration return journey."},
    {"id": "earth_return", "name": "Earth Return", "description": "Readaptation and post-mission observation."},
]


@dataclass(frozen=True)
class Scenario:
    id: ScenarioName
    name: str
    description: str
    active_phases: list[MissionPhase]
    conditions: list[str]
    effects: dict[str, float]
    expected_effects: list[str]
    assumptions: list[str]


SCENARIOS: dict[ScenarioName, Scenario] = {
    "nominal": Scenario(
        "nominal", "Nominal Mission", "Stable illustrative mission conditions with ordinary fluctuations.",
        ["pre_launch", "deep_space_transit", "mars_surface", "return_transit"],
        ["Nominal habitat operations", "Routine monitoring"],
        {},
        ["Small bounded variation around baseline measurements."],
        ["This is not a physiological prediction.", "Values are generated for demonstration only."],
    ),
    "sleep_disruption": Scenario(
        "sleep_disruption", "Sleep Disruption", "Illustrates reduced sleep opportunity and associated fatigue trends.",
        ["deep_space_transit", "return_transit"],
        ["Disrupted sleep schedule", "Limited recovery time"],
        {"sleep": -2.0, "stress": 18.0, "fatigue": 28.0},
        ["Sleep duration trends lower.", "Stress and fatigue indices trend higher."],
        ["Sleep effects are simplified and not clinically calibrated."],
    ),
    "elevated_workload": Scenario(
        "elevated_workload", "Elevated Workload", "Illustrates a period of increased physical task demand.",
        ["launch", "mars_arrival", "mars_surface"],
        ["High task workload", "Reduced rest between activities"],
        {"heart_rate": 12.0, "stress": 12.0, "fatigue": 15.0, "workload": 35.0},
        ["Heart rate and workload indices rise temporarily."],
        ["The model does not infer injury or medical risk."],
    ),
    "isolation_stress": Scenario(
        "isolation_stress", "Isolation Stress", "Illustrates gradually increasing stress during extended isolation.",
        ["deep_space_transit", "return_transit"],
        ["Communication delay", "Limited social contact"],
        {"stress": 22.0, "fatigue": 10.0},
        ["Stress index increases gradually over simulation ticks."],
        ["The stress index is dimensionless and illustrative."],
    ),
    "elevated_radiation": Scenario(
        "elevated_radiation", "Elevated Radiation Environment", "Illustrates a hypothetical increase in environmental dose rate.",
        ["deep_space_transit", "mars_arrival"],
        ["Hypothetical elevated dose rate", "Additional shielding monitoring"],
        {"radiation": 0.28, "stress": 5.0},
        ["Environmental dose-rate indicator rises.", "An environmental warning may appear."],
        ["Dose rate is an illustrative index in mSv/day, not NASA mission data.", "No direct symptom is inferred."],
    ),
    "eva_activity": Scenario(
        "eva_activity", "EVA Activity", "Illustrates extravehicular workload followed by recovery.",
        ["mars_surface"],
        ["EVA task", "Suit and habitat operations"],
        {"heart_rate": 18.0, "stress": 10.0, "fatigue": 20.0, "workload": 55.0},
        ["Workload and heart rate rise during the activity."],
        ["The activity response is a simple demonstration model."],
    ),
}


def scenario_summary(scenario: Scenario) -> dict:
    return {
        "id": scenario.id,
        "name": scenario.name,
        "description": scenario.description,
        "active_phases": scenario.active_phases,
        "environmental_conditions": scenario.conditions,
        "expected_effects": scenario.expected_effects,
        "assumptions": scenario.assumptions,
    }


def get_scenario(name: ScenarioName) -> Scenario:
    return SCENARIOS[name]


def get_phase(phase: MissionPhase) -> dict:
    return next(item for item in PHASES if item["id"] == phase)
