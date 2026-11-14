from models.analytics import AlertResponse, AnomalyResult, Prediction


def build_insights(
    health: dict,
    predictions: list[Prediction],
    anomalies: list[AnomalyResult],
    alerts: list[AlertResponse],
    scenario: str,
) -> dict:
    ready = [item for item in predictions if item.status == "ready"]
    anomaly_count = sum(item.status == "anomaly" for item in anomalies)
    alert_count = sum(not item.acknowledged for item in alerts)
    trend_text = (
        f"{len(ready)} indicators have enough observations for an experimental short-term trend estimate."
        if ready else "More mission ticks are needed before short-term trends can be estimated."
    )
    return {
        "title": "AstroHealth Insights",
        "summary": (
            f"Current scenario: {scenario}. {trend_text} "
            f"There are {alert_count} unacknowledged demonstration alerts and {anomaly_count} statistical anomalies."
        ),
        "factors": [
            "Scenario parameters and bounded random variation influence these simulated measurements.",
            "Trend and anomaly results describe data patterns only; they do not diagnose medical conditions.",
        ],
        "limitations": [
            "No clinical model, NASA medical threshold, or validated prediction accuracy is used.",
            "The in-memory history is reset when the backend process restarts.",
        ],
        "current_indicators": health,
        "data_type": "simulated_experimental",
    }
