from datetime import datetime, timezone
from threading import RLock

from models.analytics import AlertResponse


def build_alerts(health: dict) -> list[dict]:
    alerts = []
    if health["stress_index"] >= 70:
        alerts.append({
            "category": "attention",
            "metric": "Stress index",
            "value": health["stress_index"],
            "threshold": 70,
            "message": "Review the simulated stress trend and recent mission events.",
        })
    if health["fatigue_index"] >= 75:
        alerts.append({
            "category": "attention",
            "metric": "Fatigue index",
            "value": health["fatigue_index"],
            "threshold": 75,
            "message": "Review recent sleep and workload assumptions.",
        })
    if health["radiation_dose_rate"] >= 0.35:
        alerts.append({
            "category": "high_priority",
            "metric": "Environmental dose rate",
            "value": health["radiation_dose_rate"],
            "threshold": 0.35,
            "message": "Review the illustrative environmental exposure indicator.",
        })
    return alerts


ALERT_RULES = [
    ("heart_rate_high", "heart_rate", "BPM", "Heart rate above demonstration threshold", 110, "ATTENTION", "Review the simulated workload and trend."),
    ("heart_rate_low", "heart_rate", "BPM", "Heart rate below demonstration threshold", 50, "ATTENTION", "Review the simulated trend and data quality."),
    ("oxygen_low", "oxygen_saturation", "%", "Oxygen saturation below demonstration threshold", 94, "HIGH PRIORITY", "Check the simulated sensor trend; no diagnosis is implied."),
    ("stress_high", "stress_index", "index", "Stress index at or above demonstration threshold", 70, "ATTENTION", "Review scenario factors and recent recovery patterns."),
    ("fatigue_high", "fatigue_index", "index", "Fatigue index at or above demonstration threshold", 75, "ATTENTION", "Review recent sleep and workload assumptions."),
    ("radiation_elevated", "radiation_dose_rate", "mSv/day", "Environmental dose rate at or above demonstration threshold", 0.35, "HIGH PRIORITY", "Review the illustrative environmental exposure indicator."),
]


class AlertStore:
    """In-memory deduplicated alert history for the single-process prototype."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._alerts: dict[str, AlertResponse] = {}

    def refresh(self, health: dict) -> list[AlertResponse]:
        now = datetime.now(timezone.utc).isoformat()
        with self._lock:
            for rule_id, metric, unit, rule, threshold, severity, follow_up in ALERT_RULES:
                value = health.get(metric)
                triggered = value is not None and (
                    value <= threshold if rule_id in {"heart_rate_low", "oxygen_low"} else value >= threshold
                )
                if triggered and rule_id not in self._alerts:
                    self._alerts[rule_id] = AlertResponse(
                        id=rule_id,
                        metric=metric,
                        observed_value=round(value, 2),
                        unit=unit,
                        rule=rule,
                        threshold=threshold,
                        severity=severity,
                        timestamp=now,
                        explanation=f"{rule}. Thresholds are configurable demonstrations, not NASA medical standards.",
                        suggested_follow_up=follow_up,
                    )
            return list(self._alerts.values())

    def all(self, health: dict) -> list[AlertResponse]:
        return self.refresh(health)

    def acknowledge(self, alert_id: str) -> AlertResponse | None:
        with self._lock:
            alert = self._alerts.get(alert_id)
            if alert is None:
                return None
            updated = alert.model_copy(update={"acknowledged": True})
            self._alerts[alert_id] = updated
            return updated

    def reset(self) -> None:
        with self._lock:
            self._alerts.clear()

    def snapshot(self) -> dict[str, AlertResponse]:
        with self._lock:
            return dict(self._alerts)

    def restore(self, alerts: dict[str, AlertResponse]) -> None:
        with self._lock:
            self._alerts = dict(alerts)


alert_store = AlertStore()
