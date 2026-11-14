
from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from routers.digital_twin import router as digital_twin_router
from routers.analytics import router as analytics_router
from routers.mission import router as mission_router
from routers.intelligence import router as intelligence_router
from routers.reports import router as reports_router
from routers.exports import router as exports_router
from routers.command import router as command_router
from routers.demo import router as demo_router
from services.session_service import AppSession, create_session, get_session
from services.config import load_config

runtime_config = load_config()

app = FastAPI(
    title="AstroHealth API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(runtime_config.allowed_origins),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-AstroHealth-Session-Expired"],
    allow_credentials=True,
)

app.include_router(mission_router)
app.include_router(digital_twin_router)
app.include_router(analytics_router)
app.include_router(intelligence_router)
app.include_router(reports_router)
app.include_router(exports_router)
app.include_router(command_router)
app.include_router(demo_router)

@app.get("/")
def home():
    return {
        "project": "AstroHealth",
        "team": "EAGLES",
        "status": "running"
    }


@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "astrohealth-api"}

@app.get("/api/healthcheck")
def api_healthcheck():
    return {"status": "ok", "service": "astrohealth-api"}


@app.get("/api/session")
def session(request: Request, response: Response, renew: bool = False):
    return create_session(request, response, renew=renew)

@app.get("/api/astronaut")
def astronaut():
    return {
        "id": 1,
        "name": "Alex Morgan",
        "mission": "Mars Exploration",
        "status": "Active"
    }

@app.get("/api/health")
def health(session: AppSession = Depends(get_session)):
    state = session.simulator.state()
    measurement = state.health.model_dump()
    return {
        "astronaut_id": 1,
        "heart_rate": measurement["heart_rate"],
        "oxygen_level": measurement["oxygen_saturation"],
        "radiation": measurement["radiation_dose_rate"],
        "sleep_hours": measurement["sleep_hours"],
        "stress_level": measurement["stress_index"],
        "timestamp": state.last_updated,
        "data_type": "simulated"
    }

@app.get("/api/health/live")
def get_live_health(session: AppSession = Depends(get_session)):
    state = session.simulator.state()
    health = state.health.model_dump()
    return {
        "heart_rate": health["heart_rate"],
        "oxygen_level": health["oxygen_saturation"],
        "sleep_hours": health["sleep_hours"],
        "stress_level": health["stress_index"],
        "fatigue_index": health["fatigue_index"],
        "workload_index": health["workload_index"],
        "radiation": health["radiation_dose_rate"],
        "timestamp": state.last_updated,
        "data_type": "simulated",
    }

@app.get("/api/health/history")
def get_health_history(session: AppSession = Depends(get_session)):
    return [
        {
            "heart_rate": item["heart_rate"],
            "oxygen_level": item["oxygen_saturation"],
            "sleep_hours": item["sleep_hours"],
            "stress_level": item["stress_index"],
            "fatigue_index": item["fatigue_index"],
            "workload_index": item["workload_index"],
            "radiation": item["radiation_dose_rate"],
            "timestamp": item["timestamp"],
            "data_type": item["data_type"],
        }
        for item in session.simulator.history()
    ]
