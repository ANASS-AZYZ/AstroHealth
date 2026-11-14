from threading import RLock

from models.demo import DemoState
from services.alert_engine import alert_store
from services.command_service import command_service
from services.event_service import mission_event_store
from services.mission_simulator import mission_simulator


DEMO_SEED = 7042
DEMO_PRESET = "Mars Crew Health Demonstration"
DEMO_STEPS = [
    {"id": "introduction", "title": "Mission introduction", "description": "Meet AstroHealth, Team EAGLES, and the long-duration mission-health monitoring challenge.", "action": "Review the mission context."},
    {"id": "live_monitoring", "title": "Live health monitoring", "description": "Observe simulated telemetry and how the application presents health indicators.", "action": "Advance one controlled mission hour."},
    {"id": "digital_twin", "title": "Astronaut Digital Twin", "description": "Open the Digital Twin to view the same authoritative measurements in the 3D crew view.", "action": "Open Digital Twin when ready."},
    {"id": "mission_scenario", "title": "Mission scenario", "description": "The deterministic preset activates an Elevated Workload scenario over a Mars surface phase.", "action": "Review the active scenario in Mission Command."},
    {"id": "smart_alert", "title": "Smart alert", "description": "A real configured demonstration rule is triggered by the preset stress indicator; no alert is inserted in the frontend.", "action": "Review the Risk Alerts page."},
    {"id": "mission_response", "title": "Mission response", "description": "Select a context-specific response action and compare before/after simulated indicators.", "action": "Choose a response in Mission Command."},
    {"id": "analytics", "title": "AI health analytics", "description": "Review explainable statistical trends, data quality, anomalies, and forecasts when enough observations exist.", "action": "Open AI Health Analytics."},
    {"id": "report", "title": "Mission report", "description": "Generate a report from the current simulated state and review assumptions and limitations.", "action": "Download a mission report."},
]


class DemoService:
    def __init__(self, simulator=None, alerts=None, events=None, command=None) -> None:
        self._lock = RLock()
        self._simulator = simulator or mission_simulator
        self._alerts = alerts or alert_store
        self._events = events or mission_event_store
        self._command = command or command_service
        self._active = False
        self._step = 0
        self._snapshot: dict | None = None

    def _state(self) -> DemoState:
        mission = self._simulator.state()
        return DemoState(
            active=self._active,
            preset_name=DEMO_PRESET,
            seed=DEMO_SEED,
            current_step=self._step,
            total_steps=len(DEMO_STEPS),
            step=DEMO_STEPS[self._step],
            steps=DEMO_STEPS,
            mission=mission.model_dump(),
            alert_count=len(self._alerts.all(mission.health.model_dump())),
            response_available=self._command.actions() != [],
        )

    def state(self) -> DemoState:
        with self._lock:
            return self._state()

    def start(self) -> DemoState:
        with self._lock:
            if not self._active:
                self._snapshot = {
                    "mission": self._simulator.snapshot(),
                    "events": self._events.snapshot(),
                    "alerts": self._alerts.snapshot(),
                }
            self._simulator.reset(seed=DEMO_SEED)
            self._simulator.set_phase("mars_surface")
            self._simulator.set_scenario("elevated_workload")
            self._simulator.start()
            self._simulator.advance(2)
            # This is a documented preset input that triggers the real alert rule.
            self._simulator.apply_response_effects({"stress_index": 52.0, "workload_index": 18.0})
            self._command.clear()
            self._command.activate("elevated_workload")
            self._events.record("demo_started", f"{DEMO_PRESET} started with seed {DEMO_SEED}.", self._simulator.state().elapsed_hours, self._simulator.state().scenario)
            self._active = True
            self._step = 0
            return self._state()

    def advance(self, steps: int) -> DemoState:
        with self._lock:
            if not self._active:
                raise ValueError("Start the guided demo before advancing.")
            self._step = min(len(DEMO_STEPS) - 1, self._step + steps)
            if steps > 0 and self._step == 1 and self._simulator.state().status == "running":
                self._simulator.advance(1)
            return self._state()

    def reset(self) -> DemoState:
        with self._lock:
            previous_snapshot = self._snapshot
            self._active = False
            result = self.start()
            self._snapshot = previous_snapshot
            return result

    def exit(self) -> DemoState:
        with self._lock:
            if self._snapshot is not None:
                self._command.clear()
                self._simulator.restore(self._snapshot["mission"])
                self._events.restore(self._snapshot["events"])
                self._alerts.restore(self._snapshot["alerts"])
            self._snapshot = None
            self._active = False
            self._step = 0
            return self._state()


demo_service = DemoService()
