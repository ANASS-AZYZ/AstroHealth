import csv
import io
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from services.session_service import AppSession, get_session


router = APIRouter(prefix="/api/export", tags=["exports"])


def _safe_csv_value(value: object) -> object:
    if isinstance(value, str) and value.startswith(("=", "+", "-", "@")):
        return f"'{value}"
    return value


@router.get("/telemetry.csv")
def export_telemetry_csv(session: AppSession = Depends(get_session)):
    history = session.simulator.history()
    fields = ["timestamp", "heart_rate", "oxygen_saturation", "sleep_hours", "stress_index", "fatigue_index", "workload_index", "radiation_dose_rate", "data_type"]
    stream = io.StringIO()
    writer = csv.DictWriter(stream, fieldnames=fields)
    writer.writeheader()
    for item in history:
        writer.writerow({field: _safe_csv_value(item.get(field, "")) for field in fields})
    return StreamingResponse(iter([stream.getvalue()]), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="astrohealth-telemetry.csv"'})


@router.get("/telemetry.json")
def export_telemetry_json(session: AppSession = Depends(get_session)):
    state = session.simulator.state()
    payload = {"metadata": {"seed": state.seed, "scenario": state.scenario, "phase": state.phase, "units": "SI/display units documented per field"}, "telemetry": session.simulator.history()}
    return StreamingResponse(iter([json.dumps(payload)]), media_type="application/json", headers={"Content-Disposition": 'attachment; filename="astrohealth-telemetry.json"'})


@router.get("/events.json")
def export_events_json(session: AppSession = Depends(get_session)):
    state = session.simulator.state()
    alerts = session.alerts.all(state.health.model_dump())
    payload = {"metadata": {"seed": state.seed, "scenario": state.scenario, "phase": state.phase}, "events": [item.model_dump() for item in session.events.all()], "alerts": [item.model_dump() for item in alerts]}
    return StreamingResponse(iter([json.dumps(payload)]), media_type="application/json", headers={"Content-Disposition": 'attachment; filename="astrohealth-events.json"'})
