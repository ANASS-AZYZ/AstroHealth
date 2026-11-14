from datetime import datetime, timezone
from copy import deepcopy
from random import Random
from threading import RLock

from models.mission import HealthMeasurement, MissionState, MissionPhase, ScenarioName
from services.alert_engine import alert_store, build_alerts
from services.event_service import mission_event_store
from services.scenario_engine import PHASES, SCENARIOS, get_phase, get_scenario, scenario_summary


class MissionSimulator:
    """Deterministic, in-memory demonstration simulator; not a validated physiology model."""

    def __init__(self, seed: int = 2026, track_events: bool = True, alerts=None, events=None):
        self._lock = RLock()
        self._seed = seed
        self._track_events = track_events
        self._alerts = alerts
        self._events = events
        self._reset_values()

    def _record_event(self, *args, **kwargs) -> None:
        if self._track_events:
            (self._events or mission_event_store).record(*args, **kwargs)

    def _reset_values(self) -> None:
        self._rng = Random(self._seed)
        self._status = "idle"
        self._phase: MissionPhase = "pre_launch"
        self._scenario: ScenarioName = "nominal"
        self._speed = 1
        self._tick = 0
        self._elapsed_hours = 0.0
        self._health = self._baseline()
        self._history: list[dict] = []
        self._recorded_alerts: set[str] = set()

    def _baseline(self) -> dict:
        return {
            "heart_rate": 72.0,
            "oxygen_saturation": 98.0,
            "sleep_hours": 7.5,
            "stress_index": 20.0,
            "fatigue_index": 18.0,
            "workload_index": 25.0,
            "radiation_dose_rate": 0.12,
        }

    @staticmethod
    def _clamp(value: float, lower: float, upper: float) -> float:
        return round(max(lower, min(upper, value)), 2)

    def _measurement(self) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        return {
            **self._health,
            "timestamp": now,
            "data_type": "simulated",
        }

    def _advance_one(self) -> dict:
        scenario = get_scenario(self._scenario)
        effects = scenario.effects
        phase_effects = {
            "launch": {"heart_rate": 5, "workload": 15},
            "mars_arrival": {"stress": 5, "workload": 8},
            "mars_surface": {"workload": 5},
            "earth_return": {"stress": 4, "fatigue": -5},
        }.get(self._phase, {})
        noise = self._rng.uniform

        self._health["heart_rate"] = self._clamp(
            self._health["heart_rate"] + (effects.get("heart_rate", 0) + phase_effects.get("heart_rate", 0)) * 0.18 + noise(-2.0, 2.0),
            40, 180,
        )
        self._health["oxygen_saturation"] = self._clamp(self._health["oxygen_saturation"] + noise(-0.15, 0.15), 80, 100)
        self._health["sleep_hours"] = self._clamp(
            self._health["sleep_hours"] + (effects.get("sleep", 0) * 0.04) + noise(-0.08, 0.08), 0, 14,
        )
        stress_delta = effects.get("stress", 0) * 0.025 + phase_effects.get("stress", 0) * 0.025
        fatigue_delta = effects.get("fatigue", 0) * 0.035 + phase_effects.get("fatigue", 0) * 0.035
        self._health["stress_index"] = self._clamp(self._health["stress_index"] + stress_delta + noise(-1.0, 1.0), 0, 100)
        self._health["fatigue_index"] = self._clamp(self._health["fatigue_index"] + fatigue_delta + noise(-1.0, 1.0), 0, 100)
        self._health["workload_index"] = self._clamp(
            self._health["workload_index"] + (effects.get("workload", 0) + phase_effects.get("workload", 0)) * 0.08 + noise(-2.0, 2.0),
            0, 100,
        )
        self._health["radiation_dose_rate"] = self._clamp(
            self._health["radiation_dose_rate"] + effects.get("radiation", 0) * 0.03 + noise(-0.008, 0.008),
            0, 5,
        )
        self._tick += 1
        self._elapsed_hours += 1
        measurement = self._measurement()
        self._history.append(measurement)
        return measurement

    def state(self) -> MissionState:
        with self._lock:
            measurement = self._measurement()
            alerts = (self._alerts or alert_store).all(measurement)
            for alert in alerts:
                if alert.id not in self._recorded_alerts:
                    self._record_event(
                        "alert_triggered",
                        alert.rule,
                        self._elapsed_hours,
                        self._scenario,
                        alert.metric,
                    )
                    self._recorded_alerts.add(alert.id)
            return MissionState(
                status=self._status,
                phase=self._phase,
                scenario=self._scenario,
                speed=self._speed,
                seed=self._seed,
                tick=self._tick,
                elapsed_hours=self._elapsed_hours,
                mission_day=round(self._elapsed_hours / 24, 2),
                active_stressors=get_scenario(self._scenario).conditions,
                environmental_conditions=get_phase(self._phase)["description"].split("."),
                health=HealthMeasurement(**measurement),
                alerts=build_alerts(measurement),
                last_updated=measurement["timestamp"],
            )

    def start(self) -> MissionState:
        with self._lock:
            self._status = "running"
            self._record_event("simulation_started", "Simulation started.", self._elapsed_hours, self._scenario)
            return self.state()

    def pause(self) -> MissionState:
        with self._lock:
            self._status = "paused"
            self._record_event("simulation_paused", "Simulation paused.", self._elapsed_hours, self._scenario)
            return self.state()

    def resume(self) -> MissionState:
        with self._lock:
            self._status = "running"
            self._record_event("simulation_resumed", "Simulation resumed.", self._elapsed_hours, self._scenario)
            return self.state()

    def reset(self, seed: int | None = None) -> MissionState:
        with self._lock:
            if seed is not None:
                self._seed = seed
            self._reset_values()
            (self._alerts or alert_store).reset()
            (self._events or mission_event_store).reset()
            self._record_event("simulation_reset", "Simulation reset to baseline.", self._elapsed_hours, self._scenario)
            return self.state()

    def set_scenario(self, scenario: ScenarioName) -> MissionState:
        with self._lock:
            previous = self._scenario
            self._scenario = scenario
            if previous != scenario:
                self._record_event("scenario_selected", f"Scenario changed to {scenario}.", self._elapsed_hours, scenario)
            return self.state()

    def set_phase(self, phase: MissionPhase) -> MissionState:
        with self._lock:
            previous = self._phase
            self._phase = phase
            if previous != phase:
                self._record_event("mission_phase_changed", f"Mission phase changed to {phase}.", self._elapsed_hours, self._scenario)
            return self.state()

    def set_speed(self, speed: int) -> MissionState:
        with self._lock:
            previous = self._speed
            self._speed = speed
            if previous != speed:
                self._record_event("simulation_speed_changed", f"Simulation speed changed to {speed}x.", self._elapsed_hours, self._scenario)
            return self.state()

    def advance(self, ticks: int) -> MissionState:
        with self._lock:
            if self._status != "running":
                return self.state()
            for _ in range(ticks):
                self._advance_one()
            return self.state()

    def apply_response_effects(self, effects: dict[str, float]) -> MissionState:
        with self._lock:
            for metric, delta in effects.items():
                if metric in {"heart_rate", "oxygen_saturation", "sleep_hours", "stress_index", "fatigue_index", "workload_index", "radiation_dose_rate"}:
                    limits = {
                        "heart_rate": (40, 180), "oxygen_saturation": (80, 100), "sleep_hours": (0, 14),
                        "stress_index": (0, 100), "fatigue_index": (0, 100), "workload_index": (0, 100),
                        "radiation_dose_rate": (0, 5),
                    }
                    lower, upper = limits[metric]
                    self._health[metric] = self._clamp(self._health[metric] + delta, lower, upper)
            self._tick += 1
            self._elapsed_hours += 1
            measurement = self._measurement()
            self._history.append(measurement)
            return self.state()

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "seed": self._seed,
                "rng_state": self._rng.getstate(),
                "status": self._status,
                "phase": self._phase,
                "scenario": self._scenario,
                "speed": self._speed,
                "tick": self._tick,
                "elapsed_hours": self._elapsed_hours,
                "health": deepcopy(self._health),
                "history": deepcopy(self._history),
                "recorded_alerts": set(self._recorded_alerts),
            }

    def restore(self, snapshot: dict) -> MissionState:
        with self._lock:
            self._rng.setstate(snapshot["rng_state"])
            self._seed = snapshot["seed"]
            self._status = snapshot["status"]
            self._phase = snapshot["phase"]
            self._scenario = snapshot["scenario"]
            self._speed = snapshot["speed"]
            self._tick = snapshot["tick"]
            self._elapsed_hours = snapshot["elapsed_hours"]
            self._health = deepcopy(snapshot["health"])
            self._history = deepcopy(snapshot["history"])
            self._recorded_alerts = set(snapshot["recorded_alerts"])
            return self.state()

    def history(self) -> list[dict]:
        with self._lock:
            return list(self._history)

    def scenarios(self) -> list[dict]:
        return [scenario_summary(item) for item in SCENARIOS.values()]

    def phases(self) -> list[dict]:
        return list(PHASES)


mission_simulator = MissionSimulator()
