from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from services.anomaly_detector import detect_all
from services.session_service import AppSession, get_session
from services.prediction_engine import predict_all
from services.readiness_service import build_readiness
from services.scenario_engine import get_phase, get_scenario
from services.rate_limit_service import enforce_report


router = APIRouter(prefix="/api/reports", tags=["reports"])


def _draw_wrapped(pdf: canvas.Canvas, text: str, x: float, y: float, width: int = 100) -> float:
    words = text.split()
    line = ""
    for word in words:
        if len(line) + len(word) + 1 > width:
            pdf.drawString(x, y, line)
            y -= 14
            line = word
        else:
            line = f"{line} {word}".strip()
    if line:
        pdf.drawString(x, y, line)
        y -= 14
    return y


@router.get("/mission-health", dependencies=[Depends(enforce_report)])
def mission_health_report(session: AppSession = Depends(get_session)):
    state = session.simulator.state()
    history = session.simulator.history()
    alerts = session.alerts.all(state.health.model_dump())
    predictions = predict_all(history)
    anomalies = detect_all(history)
    readiness = build_readiness(state.health.model_dump(), [item.model_dump() for item in alerts])
    scenario = get_scenario(state.scenario)
    phase = get_phase(state.phase)

    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=letter)
    _, height = letter
    y = height - 48
    pdf.setTitle("AstroHealth Mission Health Report")
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(48, y, "ASTROHEALTH | MISSION HEALTH REPORT")
    y -= 24
    pdf.setFont("Helvetica", 10)
    for line in [
        "Team EAGLES | NASA Space Apps Challenge 2026",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "Astronaut: Alex Morgan | Mission: Mars Exploration",
        f"Phase: {phase['name']} | Scenario: {scenario.name}",
        f"Mission elapsed: {state.elapsed_hours} simulated hours | Status: {state.status}",
    ]:
        pdf.drawString(48, y, line)
        y -= 15
    y -= 8
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(48, y, "Health summary")
    y -= 18
    pdf.setFont("Helvetica", 10)
    health = state.health
    for label, value, unit in [
        ("Heart rate", health.heart_rate, "BPM"),
        ("Oxygen saturation", health.oxygen_saturation, "%"),
        ("Sleep duration", health.sleep_hours, "hours"),
        ("Stress index", health.stress_index, "index"),
        ("Fatigue index", health.fatigue_index, "index"),
        ("Workload index", health.workload_index, "index"),
        ("Radiation dose rate", health.radiation_dose_rate, "mSv/day"),
    ]:
        pdf.drawString(56, y, f"{label}: {value} {unit}")
        y -= 14
    y -= 8
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(48, y, "Analytics and readiness")
    y -= 18
    pdf.setFont("Helvetica", 10)
    y = _draw_wrapped(pdf, f"Data quality: {'good' if len(history) >= 8 else 'limited' if len(history) >= 3 else 'insufficient'}; sample count: {len(history)}.", 56, y)
    y = _draw_wrapped(pdf, f"Readiness demonstration score: {readiness.score}/100 ({readiness.category}).", 56, y)
    y = _draw_wrapped(pdf, f"Predictions available: {sum(item.status == 'ready' for item in predictions)} of {len(predictions)}. Detected anomalies: {sum(item.status == 'anomaly' for item in anomalies)}.", 56, y)
    y -= 5
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(48, y, "Alerts")
    y -= 18
    pdf.setFont("Helvetica", 10)
    if alerts:
        for alert in alerts:
            y = _draw_wrapped(pdf, f"{alert.severity} | {alert.rule} | {alert.timestamp} | acknowledged={alert.acknowledged}", 56, y)
    else:
        y = _draw_wrapped(pdf, "No configured demonstration alerts are active.", 56, y)
    y -= 5
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(48, y, "Mission assumptions and limitations")
    y -= 18
    pdf.setFont("Helvetica", 10)
    for text in [scenario.description, *scenario.assumptions, "Simulation values are illustrative model outputs and not validated predictions or medical advice."]:
        y = _draw_wrapped(pdf, text, 56, y)
        if y < 70:
            pdf.showPage()
            y = height - 48
            pdf.setFont("Helvetica", 10)
    pdf.save()
    output.seek(0)
    return StreamingResponse(output, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="astrohealth-mission-health-report.pdf"'})
