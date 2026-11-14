import json
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from models.command import ActivateScenarioRequest, MessageRequest, ResponseRequest
from services.session_service import AppSession, get_session
from services.rate_limit_service import enforce_mutation


router = APIRouter(prefix="/api/command", tags=["mission command"])


@router.get("/state")
def get_command_state(session: AppSession = Depends(get_session)):
    return session.command.state()


@router.get("/scenarios")
def get_command_scenarios(session: AppSession = Depends(get_session)):
    return session.command.scenarios()


@router.post("/activate", dependencies=[Depends(enforce_mutation)])
def activate_command_scenario(request: ActivateScenarioRequest, session: AppSession = Depends(get_session)):
    return session.command.activate(request.scenario_id)


@router.get("/actions")
def get_command_actions(session: AppSession = Depends(get_session)):
    return session.command.actions()


@router.post("/respond", dependencies=[Depends(enforce_mutation)])
def respond_to_scenario(request: ResponseRequest, session: AppSession = Depends(get_session)):
    try:
        return session.command.respond(request.action_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/events")
def get_command_events(event_type: str | None = Query(default=None), session: AppSession = Depends(get_session)):
    return session.events.all(event_type)


@router.post("/reset", dependencies=[Depends(enforce_mutation)])
def reset_command(session: AppSession = Depends(get_session)):
    return session.command.reset()


@router.post("/messages", dependencies=[Depends(enforce_mutation)])
def send_command_message(request: MessageRequest, session: AppSession = Depends(get_session)):
    return session.command.send_message(request.message)


@router.get("/messages")
def get_command_messages(session: AppSession = Depends(get_session)):
    return session.command.messages()


def _after_action_pdf(payload: dict) -> BytesIO:
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=letter)
    _, height = letter
    y = height - 48
    pdf.setTitle("AstroHealth Emergency After-Action Summary")
    pdf.setFont("Helvetica-Bold", 17)
    pdf.drawString(48, y, "ASTROHEALTH | EMERGENCY AFTER-ACTION SUMMARY")
    y -= 25
    pdf.setFont("Helvetica", 10)
    scenario = payload.get("scenario")
    lines = [
        f"Scenario: {scenario['name'] if scenario else 'None activated'}",
        f"Simulated elapsed time: {payload['elapsed_hours']} hours",
        f"Actions applied: {len(payload['selected_actions'])}",
        f"Generated: {payload['generated_at']}",
    ]
    for line in lines:
        pdf.drawString(48, y, line)
        y -= 16
    y -= 8
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(48, y, "Response actions")
    y -= 18
    pdf.setFont("Helvetica", 10)
    for action in payload["selected_actions"] or [{"action_name": "None", "explanation": "No response action was selected."}]:
        pdf.drawString(56, y, f"{action['action_name']}: {action['explanation']}")
        y -= 15
    y -= 8
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(48, y, "Measurements")
    y -= 18
    pdf.setFont("Helvetica", 9)
    for metric in ("heart_rate", "oxygen_saturation", "sleep_hours", "stress_index", "fatigue_index", "workload_index", "radiation_dose_rate"):
        initial = payload["initial_measurements"].get(metric) if payload["initial_measurements"] else None
        final = payload["final_measurements"].get(metric)
        pdf.drawString(56, y, f"{metric}: initial={initial if initial is not None else 'unavailable'} | final={final}")
        y -= 13
    pdf.drawString(56, y, f"Generated alerts: {len(payload['alerts'])} | Recorded mission events: {len(payload['events'])}")
    y -= 21
    y -= 8
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(48, y, "Limitations")
    y -= 18
    pdf.setFont("Helvetica", 10)
    for limitation in payload["limitations"]:
        pdf.drawString(56, y, limitation)
        y -= 15
    pdf.save()
    output.seek(0)
    return output


@router.get("/after-action.json")
def get_after_action_json(session: AppSession = Depends(get_session)):
    return session.command.after_action()


@router.get("/after-action.pdf")
def get_after_action_pdf(session: AppSession = Depends(get_session)):
    output = _after_action_pdf(session.command.after_action())
    return StreamingResponse(output, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="astrohealth-emergency-after-action.pdf"'})
