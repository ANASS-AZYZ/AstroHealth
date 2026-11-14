from fastapi import APIRouter, Depends

from services.anomaly_detector import detect_all
from services.insight_engine import build_insights
from services.session_service import AppSession, get_session
from services.prediction_engine import predict_all


router = APIRouter(prefix="/api/digital-twin", tags=["digital-twin"])


@router.get("")
def get_digital_twin(session: AppSession = Depends(get_session)):
    state = session.simulator.state()
    history = session.simulator.history()
    predictions = predict_all(history)
    anomalies = detect_all(history)
    alerts = session.alerts.all(state.health.model_dump())
    if any(alert.severity == "HIGH PRIORITY" for alert in alerts):
        status = "high_priority"
        explanation = "An illustrative environmental threshold is currently active."
    elif alerts:
        status = "attention"
        explanation = "One or more illustrative trends should be reviewed."
    else:
        status = "nominal"
        explanation = "All illustrative indicators are within configured demonstration ranges."
    return {
        "astronaut": {
            "id": 1,
            "name": "Alex Morgan",
            "mission_role": "Flight specialist",
            "mission": "Mars Exploration",
        },
        "status": status,
        "status_explanation": explanation,
        "mission": state,
        "alerts": alerts,
        "predictions": predictions,
        "insights": build_insights(
            state.health.model_dump(), predictions, anomalies, alerts, state.scenario
        ),
    }
