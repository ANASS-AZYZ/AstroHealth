import { useCallback, useEffect, useState } from "react";
import { Activity, Brain, HeartPulse, Moon, Radio, ShieldCheck } from "lucide-react";
import AstronautVisualization from "../components/AstronautVisualization";
import PageFrame from "./PageFrame";
import { getDigitalTwin } from "../services/api";

function DigitalTwin() {
  const [twin, setTwin] = useState(null);
  const [selected, setSelected] = useState("heart_rate");
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setTwin(await getDigitalTwin()); setError(""); } catch { setError("Digital Twin API is unavailable."); } }, []);
  useEffect(() => { const initial = setTimeout(load, 0); const timer = setInterval(load, 3000); return () => { clearTimeout(initial); clearInterval(timer); }; }, [load]);
  if (!twin) return error
    ? <PageFrame title="Astronaut digital twin" section="DIGITAL TWIN"><div className="empty-state"><h2>Digital Twin unavailable</h2><p>{error}</p><button onClick={() => { setError(""); load(); }}>Retry</button></div></PageFrame>
    : <main className="loading-screen"><p>Synchronizing Astronaut Digital Twin...</p></main>;
  const health = twin.mission.health;
  const metrics = [
    { key: "heart_rate", label: "Heart rate", value: health.heart_rate, unit: "BPM", icon: HeartPulse },
    { key: "oxygen_saturation", label: "Oxygen", value: health.oxygen_saturation, unit: "%", icon: Activity },
    { key: "sleep_hours", label: "Sleep", value: health.sleep_hours, unit: "hours", icon: Moon },
    { key: "stress_index", label: "Stress", value: health.stress_index, unit: "index", icon: Brain },
    { key: "fatigue_index", label: "Fatigue", value: health.fatigue_index, unit: "index", icon: Brain },
    { key: "workload_index", label: "Workload", value: health.workload_index, unit: "index", icon: Activity },
    { key: "radiation_dose_rate", label: "Radiation rate", value: health.radiation_dose_rate, unit: "mSv/day", icon: Radio },
  ];
  const selectedMetric = metrics.find((metric) => metric.key === selected) || metrics[0];
  return <PageFrame title="Astronaut digital twin" section="DIGITAL TWIN" error={error}>
    <section className="twin-header"><div><p className="eyebrow">SYNCHRONIZED CREW REPRESENTATION</p><h2>{twin.astronaut.name}</h2><p className="muted">{twin.astronaut.mission_role} · {twin.astronaut.mission}</p></div><div className={`twin-status twin-${twin.status}`}><ShieldCheck size={17} /> {twin.status.replace("_", " ").toUpperCase()}</div></section>
    <section className="twin-grid"><AstronautVisualization onSelect={setSelected} selectedMetric={selectedMetric} /><div className="twin-data"><div className="twin-context"><p className="eyebrow">CURRENT MISSION STATE</p><strong>{twin.mission.phase.replaceAll("_", " ")}</strong><span>Scenario: {twin.mission.scenario.replaceAll("_", " ")}</span><p>{twin.status_explanation}</p></div><div className="twin-metrics">{metrics.map(({ icon: Icon, ...metric }) => <button key={metric.key} className={`twin-metric ${selected === metric.key ? "selected" : ""}`} onClick={() => setSelected(metric.key)}><Icon size={16} /><span>{metric.label}</span><strong>{metric.value} <small>{metric.unit}</small></strong></button>)}</div><div className="selected-sensor"><p className="eyebrow">SELECTED INDICATOR</p><h3>{selectedMetric.label}</h3><strong>{selectedMetric.value} <small>{selectedMetric.unit}</small></strong><p>Current value from the authoritative mission simulation state. This marker is an interface aid, not a claim about a physical sensor location.</p></div></div></section>
    <section className="twin-alerts"><div className="panel-title"><ShieldCheck size={17} /><h3>Alerts reflected in the twin</h3></div>{twin.alerts?.length ? twin.alerts.map((alert) => <p key={alert.id}><ShieldCheck size={14} /> {alert.metric}: {alert.explanation}</p>) : <p className="muted">No active alerts in the current simulated state.</p>}</section>
    <footer className="disclaimer">This Digital Twin is fictional and synchronized with simulated mission telemetry. It is not a medical device or clinical representation.</footer>
  </PageFrame>;
}

export default DigitalTwin;
