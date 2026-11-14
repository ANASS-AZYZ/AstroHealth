from fastapi import APIRouter, Depends, HTTPException

from models.analytics import AnalyticsSummary, InsightsResponse
from services.anomaly_detector import detect_all
from services.insight_engine import build_insights
from services.prediction_engine import predict_all
from services.session_service import AppSession, get_session
from services.rate_limit_service import enforce_mutation


router = APIRouter(prefix="/api", tags=["analytics"])


def _analytics(session: AppSession) -> dict:
    state = session.simulator.state()
    history = session.simulator.history()
    predictions = predict_all(history)
    anomalies = detect_all(history)
    alerts = session.alerts.all(state.health.model_dump())
    quality = "good" if len(history) >= 8 else "limited" if len(history) >= 3 else "insufficient"
    return {
        "state": state,
        "history": history,
        "predictions": predictions,
        "anomalies": anomalies,
        "alerts": alerts,
        "data_quality": quality,
    }


@router.get("/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(session: AppSession = Depends(get_session)):
    result = _analytics(session)
    state = result["state"]
    return {
        "mission_day": state.mission_day,
        "scenario": state.scenario,
        "phase": state.phase,
        "observations": len(result["history"]),
        "predictions": result["predictions"],
        "anomalies": result["anomalies"],
        "alerts": result["alerts"],
        "data_quality": result["data_quality"],
        "disclaimer": "Simulated, experimental analytics only; not clinically validated or medical advice.",
    }


@router.get("/analytics/predictions")
def get_predictions(session: AppSession = Depends(get_session)):
    return _analytics(session)["predictions"]


@router.get("/analytics/anomalies")
def get_anomalies(session: AppSession = Depends(get_session)):
    return _analytics(session)["anomalies"]


@router.get("/alerts")
def get_alerts(session: AppSession = Depends(get_session)):
    return _analytics(session)["alerts"]


@router.post("/alerts/{alert_id}/acknowledge", dependencies=[Depends(enforce_mutation)])
def acknowledge_alert(alert_id: str, session: AppSession = Depends(get_session)):
    alert = session.alerts.acknowledge(alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    state = session.simulator.state()
    session.events.record(
        "alert_acknowledged",
        f"Alert acknowledged: {alert.rule}.",
        state.elapsed_hours,
        state.scenario,
        alert.metric,
    )
    return alert


def _get_insights(session: AppSession) -> dict:
    result = _analytics(session)
    state = result["state"]
    return build_insights(
        state.health.model_dump(),
        result["predictions"],
        result["anomalies"],
        result["alerts"],
        state.scenario,
    )


@router.get("/insights", response_model=InsightsResponse)
def get_insights(session: AppSession = Depends(get_session)):
    return _get_insights(session)


@router.get("/analytics/insights", response_model=InsightsResponse)
def get_analytics_insights(session: AppSession = Depends(get_session)):
    return _get_insights(session)
