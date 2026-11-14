from fastapi import APIRouter, Depends, Query

from models.intelligence import ScenarioComparisonRequest
from services.comparison_service import compare_scenarios
from services.session_service import AppSession, get_session
from services.readiness_service import build_readiness
from services.rate_limit_service import enforce_comparison


router = APIRouter(prefix="/api/mission", tags=["mission intelligence"])


@router.get("/events")
def get_mission_events(event_type: str | None = Query(default=None), session: AppSession = Depends(get_session)):
    return session.events.all(event_type)


@router.get("/readiness")
def get_readiness(session: AppSession = Depends(get_session)):
    state = session.simulator.state()
    alerts = session.alerts.all(state.health.model_dump())
    return build_readiness(state.health.model_dump(), [alert.model_dump() for alert in alerts])


@router.post("/compare", dependencies=[Depends(enforce_comparison)])
def compare_mission_scenarios(request: ScenarioComparisonRequest, session: AppSession = Depends(get_session)):
    return compare_scenarios(request, session.simulator.state().seed)
