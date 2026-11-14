import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { acknowledgeAlert, getAlerts } from "../services/api";
import PageFrame from "./PageFrame";

function RiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const loadAlerts = useCallback(async () => {
    try { setAlerts(await getAlerts()); setError(""); } catch { setError("Unable to load alert telemetry."); }
  }, []);
  useEffect(() => {
    const initialRequest = setTimeout(loadAlerts, 0);
    const timer = setInterval(loadAlerts, 5000);
    return () => { clearTimeout(initialRequest); clearInterval(timer); };
  }, [loadAlerts]);
  const acknowledge = async (id) => {
    try { const updated = await acknowledgeAlert(id); setAlerts((current) => current.map((alert) => alert.id === id ? updated : alert)); } catch { setError("Unable to acknowledge this alert."); }
  };
  const active = alerts.filter((alert) => !alert.acknowledged);
  return (
    <PageFrame title="Risk alerts" section="RISK ALERTS" error={error}>
      <section className="alert-summary"><div><p className="eyebrow">DEMONSTRATION ALERT ENGINE</p><h2>{active.length} active alert{active.length === 1 ? "" : "s"}</h2></div><p className="muted">Thresholds are illustrative, not NASA medical standards.</p></section>
      <div className="section-heading"><div><p className="eyebrow">ACTIVE QUEUE</p><h2>Review required</h2></div></div>
      <section className="alerts-list">{active.length ? active.map((alert) => <AlertCard key={alert.id} alert={alert} onAcknowledge={acknowledge} />) : <div className="empty-state"><CheckCircle2 size={26} /><h3>No active alerts</h3><p>Simulated telemetry is currently within configured demonstration rules.</p></div>}</section>
      <div className="section-heading"><div><p className="eyebrow">ALERT HISTORY</p><h2>Previously reviewed</h2></div></div>
      <section className="alerts-list">{alerts.filter((alert) => alert.acknowledged).map((alert) => <AlertCard key={alert.id} alert={alert} />)}{!alerts.some((alert) => alert.acknowledged) && <p className="muted">No acknowledged alerts yet.</p>}</section>
      <footer className="disclaimer"><ShieldAlert size={16} /> Alerts explain statistical or threshold patterns only; they are not medical diagnoses.</footer>
    </PageFrame>
  );
}

function AlertCard({ alert, onAcknowledge }) {
  return <article className={`alert-card severity-${alert.severity.toLowerCase().replace(" ", "-")}`}><div className="alert-icon"><ShieldAlert size={20} /></div><div className="alert-body"><div className="alert-title"><h3>{alert.metric}</h3><span className="severity-badge">{alert.severity}</span></div><p>{alert.explanation}</p><p className="alert-meta"><Clock3 size={13} /> {new Date(alert.timestamp).toLocaleString()} · Observed {alert.observed_value} {alert.unit} · Threshold {alert.threshold}</p><p className="alert-follow-up">Suggested follow-up: {alert.suggested_follow_up}</p></div>{onAcknowledge && <button className="ack-button" onClick={() => onAcknowledge(alert.id)}>Acknowledge</button>}</article>;
}

export default RiskAlerts;
