from fastapi import APIRouter, Depends

from models.mission import AdvanceRequest, PhaseRequest, ScenarioRequest, SpeedRequest
from services.session_service import AppSession, get_session
from services.rate_limit_service import enforce_mutation
from services.mission_simulator import mission_simulator


router = APIRouter(prefix="/api/mission", tags=["mission"])


@router.get("/state")
def get_mission_state(session: AppSession = Depends(get_session)):
    return session.simulator.state()


@router.post("/start", dependencies=[Depends(enforce_mutation)])
def start_mission(session: AppSession = Depends(get_session)):
    return session.simulator.start()


@router.post("/pause", dependencies=[Depends(enforce_mutation)])
def pause_mission(session: AppSession = Depends(get_session)):
    return session.simulator.pause()


@router.post("/resume", dependencies=[Depends(enforce_mutation)])
def resume_mission(session: AppSession = Depends(get_session)):
    return session.simulator.resume()


@router.post("/reset", dependencies=[Depends(enforce_mutation)])
def reset_mission(session: AppSession = Depends(get_session)):
    return session.simulator.reset()


@router.post("/scenario", dependencies=[Depends(enforce_mutation)])
def select_scenario(request: ScenarioRequest, session: AppSession = Depends(get_session)):
    return session.simulator.set_scenario(request.scenario)


@router.post("/phase", dependencies=[Depends(enforce_mutation)])
def select_phase(request: PhaseRequest, session: AppSession = Depends(get_session)):
    return session.simulator.set_phase(request.phase)


@router.post("/speed", dependencies=[Depends(enforce_mutation)])
def select_speed(request: SpeedRequest, session: AppSession = Depends(get_session)):
    return session.simulator.set_speed(request.speed)


@router.post("/advance", dependencies=[Depends(enforce_mutation)])
def advance_mission(request: AdvanceRequest, session: AppSession = Depends(get_session)):
    return session.simulator.advance(request.ticks)


@router.get("/history")
def get_mission_history(session: AppSession = Depends(get_session)):
    return session.simulator.history()


@router.get("/scenarios")
def get_scenarios():
    return mission_simulator.scenarios()


@router.get("/phases")
def get_phases():
    return mission_simulator.phases()
