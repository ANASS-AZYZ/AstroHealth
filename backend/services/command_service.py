from dataclasses import dataclass
from datetime import datetime, timezone
from threading import RLock
from uuid import uuid4

from models.command import CommandMessage, EmergencyScenarioId
from services.event_service import mission_event_store
from services.mission_simulator import mission_simulator


@dataclass(frozen=True)
class ResponseAction:
    id: str
    name: str
    description: str
    effects: dict[str, float]
    explanation: str


@dataclass(frozen=True)
class EmergencyScenario:
    id: EmergencyScenarioId
    name: str
    description: str
    starting_conditions: list[str]
    affected_indicators: list[str]
    parameters: dict[str, float | str]
    actions: tuple[ResponseAction, ...]
    assumptions: list[str]
    expected_outcomes: list[str]


SCENARIOS: dict[EmergencyScenarioId, EmergencyScenario] = {
    "sleep_deprivation": EmergencyScenario(
        "sleep_deprivation", "Sleep Deprivation", "Reduced sleep opportunity with cumulative fatigue.",
        ["Sleep opportunity is reduced.", "Baseline telemetry remains authoritative."],
        ["sleep_hours", "fatigue_index", "stress_index"],
        {"sleep_loss_hours": 1.5, "step_hours": 1},
        (
            ResponseAction("schedule_rest", "Schedule Rest Period", "Recover sleep and reduce fatigue.", {"sleep_hours": 1.0, "fatigue_index": -8.0, "stress_index": -3.0}, "Rest adds recovery in the illustrative model."),
            ResponseAction("reduce_workload", "Reduce Workload", "Lower task demand while preserving the sleep deficit.", {"workload_index": -15.0, "fatigue_index": -3.0}, "Reduced demand limits additional fatigue."),
            ResponseAction("continue_schedule", "Continue Current Schedule", "No intervention; allow the condition to persist.", {"fatigue_index": 6.0, "stress_index": 3.0, "sleep_hours": -0.5}, "The model applies continued recovery debt."),
        ),
        ["Sleep effects are simplified and not clinically calibrated."], ["Rest lowers fatigue.", "Continuing the schedule increases fatigue."],
    ),
    "elevated_workload": EmergencyScenario(
        "elevated_workload", "Elevated Workload", "Increased task demand with illustrative heart-rate and workload trends.",
        ["Task workload is elevated.", "No injury or diagnosis is inferred."],
        ["workload_index", "heart_rate", "fatigue_index", "stress_index"],
        {"workload_increment": 20.0, "step_hours": 1},
        (
            ResponseAction("reduce_activity", "Reduce Activity", "Reduce task demand immediately.", {"workload_index": -20.0, "heart_rate": -5.0, "stress_index": -2.0}, "Lower demand reduces the illustrative load."),
            ResponseAction("schedule_recovery", "Schedule Recovery", "Reduce workload and allow recovery.", {"workload_index": -12.0, "fatigue_index": -7.0, "heart_rate": -3.0}, "Recovery lowers load and fatigue."),
            ResponseAction("continue_monitoring", "Continue Monitoring", "Observe without changing the workload.", {"workload_index": 8.0, "heart_rate": 3.0, "fatigue_index": 4.0}, "The model keeps the elevated demand active."),
        ),
        ["Effects are bounded demonstration indices, not operational guidance."], ["Reducing activity lowers workload.", "Monitoring alone allows a small rise."],
    ),
    "isolation_stress": EmergencyScenario(
        "isolation_stress", "Isolation Stress", "Gradually increasing simulated stress during limited contact.",
        ["Communication opportunities are limited.", "Stress index is dimensionless."],
        ["stress_index", "fatigue_index", "workload_index"],
        {"stress_increment": 12.0, "step_hours": 1},
        (
            ResponseAction("schedule_recreation", "Schedule Recreation", "Add a recovery activity.", {"stress_index": -10.0, "fatigue_index": -2.0}, "Recreation reduces the illustrative stress index."),
            ResponseAction("adjust_workload", "Adjust Workload", "Reduce task demand during isolation.", {"workload_index": -12.0, "stress_index": -4.0}, "Lower demand reduces modeled stress."),
            ResponseAction("request_delayed_support", "Request Delayed Mission Support", "Queue a support message using the mission clock.", {"stress_index": -6.0}, "Support changes the index modestly after a communication delay."),
        ),
        ["The index is not a psychological diagnosis."], ["Support and recreation reduce stress in this illustrative model."],
    ),
    "elevated_radiation_environment": EmergencyScenario(
        "elevated_radiation_environment", "Elevated Radiation Environment", "Hypothetical environmental dose-rate warning.",
        ["Environmental dose-rate indicator is elevated.", "No immediate symptom is inferred."],
        ["radiation_dose_rate", "stress_index"],
        {"dose_rate_increment": 0.28, "step_hours": 1},
        (
            ResponseAction("review_environmental_data", "Review Environmental Data", "Inspect the indicator without changing it.", {"stress_index": -1.0}, "Review has a small modeled uncertainty reduction."),
            ResponseAction("protective_mode", "Enter Simulated Protective Mode", "Apply an illustrative shielding response.", {"radiation_dose_rate": -0.18, "stress_index": -2.0}, "Protective mode reduces the environmental indicator only."),
            ResponseAction("request_mission_control_review", "Request Mission Control Review", "Queue an Earth review message.", {"stress_index": -1.0}, "Review is represented as a delayed support action."),
        ),
        ["Dose rate is an illustrative environmental indicator in mSv/day.", "It is not mission data or a medical exposure assessment."], ["Protective mode lowers the indicator without inferring symptoms."],
    ),
    "communication_delay": EmergencyScenario(
        "communication_delay", "Communication Delay", "Delayed communication between Earth and spacecraft.",
        ["One-way delay is controlled by mission time.", "Network latency is not represented."],
        ["stress_index"],
        {"one_way_delay_hours": 22.0, "step_hours": 1},
        (
            ResponseAction("send_status_request", "Send Status Request", "Send a demonstration status request.", {"stress_index": -1.0}, "The request is queued until simulated delivery."),
            ResponseAction("continue_autonomous_monitoring", "Continue Autonomous Monitoring", "Continue with no message.", {"stress_index": 2.0}, "The model applies a small communication uncertainty cost."),
        ),
        ["Delay is fictional and scenario-configurable."], ["Messages remain pending until mission time reaches delivery."],
    ),
    "habitat_environmental_warning": EmergencyScenario(
        "habitat_environmental_warning", "Habitat Environmental Warning", "Hypothetical habitat monitoring warning.",
        ["A habitat indicator requires review.", "No real spacecraft procedure is implied."],
        ["stress_index", "workload_index"],
        {"warning_level": "amber", "step_hours": 1},
        (
            ResponseAction("review_environmental_data", "Review Environmental Data", "Review the simulated habitat indicator.", {"stress_index": -2.0}, "Review reduces modeled uncertainty."),
            ResponseAction("protective_mode", "Enter Simulated Protective Mode", "Apply a reversible demonstration mode.", {"workload_index": -8.0, "stress_index": -3.0}, "The mode reduces modeled workload."),
            ResponseAction("request_mission_control_review", "Request Mission Control Review", "Queue a delayed review message.", {"stress_index": -1.0}, "Review is delayed by the mission clock."),
        ),
        ["Indicators are fictional demonstration inputs."], ["Review and protective mode reduce modeled workload or uncertainty."],
    ),
}


class CommandService:
    def __init__(self, simulator=None, events=None) -> None:
        self._lock = RLock()
        self._simulator = simulator or mission_simulator
        self._events = events or mission_event_store
        self._active: EmergencyScenarioId | None = None
        self._initial: dict | None = None
        self._actions: list[dict] = []
        self._last_consequence: dict | None = None
        self._messages: list[CommandMessage] = []

    def scenarios(self) -> list[dict]:
        return [self._scenario_dict(item) for item in SCENARIOS.values()]

    @staticmethod
    def _scenario_dict(scenario: EmergencyScenario) -> dict:
        return {
            "id": scenario.id, "name": scenario.name, "description": scenario.description,
            "starting_conditions": scenario.starting_conditions, "affected_indicators": scenario.affected_indicators,
            "parameters": scenario.parameters, "actions": [
                {"id": action.id, "name": action.name, "description": action.description, "explanation": action.explanation}
                for action in scenario.actions
            ], "assumptions": scenario.assumptions, "expected_outcomes": scenario.expected_outcomes,
        }

    def activate(self, scenario_id: EmergencyScenarioId) -> dict:
        with self._lock:
            scenario = SCENARIOS[scenario_id]
            state = self._simulator.state()
            self._active = scenario_id
            self._initial = state.health.model_dump()
            self._actions = []
            self._last_consequence = None
            self._events.record("emergency_scenario_activated", f"Emergency scenario activated: {scenario.name}.", state.elapsed_hours, state.scenario)
            return self.state()

    def state(self) -> dict:
        with self._lock:
            mission_hour = self._simulator.state().elapsed_hours
            self._sync_messages(mission_hour)
            return {
                "mission": self._simulator.state(),
                "active_scenario": self._scenario_dict(SCENARIOS[self._active]) if self._active else None,
                "initial_measurements": self._initial,
                "selected_actions": list(self._actions),
                "last_consequence": self._last_consequence,
                "messages": [item.model_dump() for item in self._messages],
            }

    def actions(self) -> list[dict]:
        return self._scenario_dict(SCENARIOS[self._active])["actions"] if self._active else []

    def respond(self, action_id: str) -> dict:
        with self._lock:
            if not self._active:
                raise ValueError("Activate an emergency scenario before selecting a response.")
            scenario = SCENARIOS[self._active]
            action = next((item for item in scenario.actions if item.id == action_id), None)
            if action is None:
                raise ValueError("Action is not available for the active scenario.")
            before = self._simulator.state().health.model_dump()
            after_state = self._simulator.apply_response_effects(action.effects)
            after = after_state.health.model_dump()
            record = {"action_id": action.id, "action_name": action.name, "description": action.description, "explanation": action.explanation, "before": before, "after": after, "changed": {key: round(after[key] - before[key], 2) for key in action.effects}}
            self._actions.append(record)
            self._last_consequence = record
            self._events.record("emergency_response_applied", f"{action.name} applied: {action.explanation}", after_state.elapsed_hours, after_state.scenario)
            if action.id in {"send_status_request", "request_delayed_support", "request_mission_control_review"}:
                self.send_message(f"Demonstration request: {action.name}.")
            return self.state()

    def send_message(self, text: str) -> CommandMessage:
        with self._lock:
            state = self._simulator.state()
            scenario = SCENARIOS[self._active] if self._active else None
            delay = float(scenario.parameters.get("one_way_delay_hours", 2.0)) if scenario else 2.0
            message = CommandMessage(id=str(uuid4()), text=text, sender="earth_mission_control", sent_at_mission_hour=state.elapsed_hours, delivery_at_mission_hour=state.elapsed_hours + delay, delivered=False)
            self._messages.append(message)
            self._events.record("communication_message_sent", f"Message queued with {delay:g}h one-way delay.", state.elapsed_hours, state.scenario)
            return message

    def _sync_messages(self, mission_hour: float) -> None:
        for index, message in enumerate(self._messages):
            if not message.delivered and mission_hour >= message.delivery_at_mission_hour:
                self._messages[index] = message.model_copy(update={"delivered": True, "delivered_at_mission_hour": mission_hour})
                self._events.record("communication_message_delivered", "Demonstration message delivered.", mission_hour, self._simulator.state().scenario)

    def messages(self) -> list[CommandMessage]:
        with self._lock:
            self._sync_messages(self._simulator.state().elapsed_hours)
            return list(self._messages)

    def reset(self) -> dict:
        with self._lock:
            state = self._simulator.reset()
            self._active = None
            self._initial = None
            self._actions = []
            self._last_consequence = None
            self._messages = []
            return self.state()

    def clear(self) -> None:
        with self._lock:
            self._active = None
            self._initial = None
            self._actions = []
            self._last_consequence = None
            self._messages = []

    def after_action(self) -> dict:
        result = self.state()
        return {
            "scenario": result["active_scenario"],
            "initial_measurements": result["initial_measurements"],
            "selected_actions": result["selected_actions"],
            "final_measurements": result["mission"].health.model_dump(),
            "elapsed_hours": result["mission"].elapsed_hours,
            "alerts": result["mission"].alerts,
            "events": [event.model_dump() for event in self._events.all()],
            "assumptions": result["active_scenario"]["assumptions"] if result["active_scenario"] else ["No emergency scenario activated."],
            "limitations": ["Educational simulation only.", "No real medical, spacecraft, or operational response is represented."],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }


command_service = CommandService()
