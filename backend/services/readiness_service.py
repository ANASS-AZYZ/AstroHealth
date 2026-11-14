from models.intelligence import ReadinessScore


def build_readiness(health: dict, active_alerts: list[dict]) -> ReadinessScore:
    inputs = {
        "fatigue_index": float(health.get("fatigue_index", 0)),
        "stress_index": float(health.get("stress_index", 0)),
        "sleep_hours": float(health.get("sleep_hours", 0)),
        "workload_index": float(health.get("workload_index", 0)),
        "active_alerts": float(sum(not alert.get("acknowledged", False) for alert in active_alerts)),
    }
    weights = {
        "fatigue_index": 0.30,
        "stress_index": 0.25,
        "sleep_hours": 0.20,
        "workload_index": 0.15,
        "active_alerts": 0.10,
    }
    sleep_penalty = max(0.0, min(100.0, (8.0 - inputs["sleep_hours"]) * 20.0))
    alert_penalty = min(100.0, inputs["active_alerts"] * 25.0)
    penalty = (
        inputs["fatigue_index"] * weights["fatigue_index"]
        + inputs["stress_index"] * weights["stress_index"]
        + sleep_penalty * weights["sleep_hours"]
        + inputs["workload_index"] * weights["workload_index"]
        + alert_penalty * weights["active_alerts"]
    )
    score = round(max(0.0, min(100.0, 100.0 - penalty)))
    category = "Nominal" if score >= 80 else "Attention" if score >= 60 else "Review Required"
    return ReadinessScore(
        score=score,
        category=category,
        formula="100 - (fatigue x 0.30 + stress x 0.25 + sleep deficit x 0.20 + workload x 0.15 + alert penalty x 0.10)",
        weights=weights,
        inputs=inputs,
        missing_data_behavior="Missing indicators contribute zero penalty and are disclosed by the source data quality.",
        limitations=[
            "Demonstration-only rules, not NASA operational or medical readiness standards.",
            "The score cannot determine whether an astronaut is medically fit for duty.",
            "Inputs are simulated and not clinically validated.",
        ],
    )
