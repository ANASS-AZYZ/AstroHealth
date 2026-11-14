from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from models.demo import DemoAdvanceRequest
from services.session_service import AppSession, get_session
from services.rate_limit_service import enforce_mutation


router = APIRouter(prefix="/api/demo", tags=["guided demo"])


@router.get("/status")
def get_demo_status(session: AppSession = Depends(get_session)):
    repo_root = Path(__file__).resolve().parents[2]
    model_available = (repo_root / "frontend" / "public" / "models" / "astronaut.glb").is_file()
    history_count = len(session.simulator.history())
    from routers.analytics import router as analytics_router
    from routers.reports import router as reports_router
    analytics_available = any(route.path == "/api/analytics/summary" for route in analytics_router.routes)
    reports_available = any(route.path == "/api/reports/mission-health" for route in reports_router.routes)
    checks = [
        {"id": "backend", "name": "FastAPI backend", "status": "Ready", "detail": "Mission API is responding.", "guidance": ""},
        {"id": "digital_twin_model", "name": "Digital Twin GLB model", "status": "Ready" if model_available else "Requires Setup", "detail": "Astronaut model is available." if model_available else "astronaut.glb is missing.", "guidance": "" if model_available else "Restore frontend/public/models/astronaut.glb."},
        {"id": "telemetry", "name": "Telemetry history", "status": "Ready" if history_count >= 3 else "Requires Setup", "detail": f"{history_count} observations available.", "guidance": "" if history_count >= 3 else "Start the mission and advance at least three simulated ticks."},
        {"id": "analytics", "name": "AI Health Analytics", "status": "Ready" if analytics_available else "Unavailable", "detail": "Analytics routes are registered." if analytics_available else "Analytics route is missing.", "guidance": "" if analytics_available else "Check backend analytics router registration."},
        {"id": "reports", "name": "Mission report generation", "status": "Ready" if reports_available else "Unavailable", "detail": "PDF report route is registered." if reports_available else "Report route is missing.", "guidance": "" if reports_available else "Check backend report router registration."},
    ]
    return {"checks": checks, "ready": all(item["status"] == "Ready" for item in checks)}


@router.get("/state")
def get_demo_state(session: AppSession = Depends(get_session)):
    return session.demo.state()


@router.post("/start", dependencies=[Depends(enforce_mutation)])
def start_demo(session: AppSession = Depends(get_session)):
    return session.demo.start()


@router.post("/advance", dependencies=[Depends(enforce_mutation)])
def advance_demo(request: DemoAdvanceRequest, session: AppSession = Depends(get_session)):
    try:
        return session.demo.advance(request.steps)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/reset", dependencies=[Depends(enforce_mutation)])
def reset_demo(session: AppSession = Depends(get_session)):
    return session.demo.reset()


@router.post("/exit", dependencies=[Depends(enforce_mutation)])
def exit_demo(session: AppSession = Depends(get_session)):
    return session.demo.exit()
