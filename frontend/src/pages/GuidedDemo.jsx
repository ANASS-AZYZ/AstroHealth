import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Play, RotateCcw, Square, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageFrame from "./PageFrame";
import {
  advanceDemo, exitDemo, getDemoState, getDemoStatus, resetDemo, startDemo,
} from "../services/api";

function GuidedDemo() {
  const navigate = useNavigate();
  const [demo, setDemo] = useState(null);
  const [status, setStatus] = useState(null);
  const [presentation, setPresentation] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [state, health] = await Promise.all([getDemoState(), getDemoStatus()]);
      setDemo(state); setStatus(health); setError("");
    } catch { setError("Guided Demo services are unavailable."); }
  }, []);
  useEffect(() => { const initial = setTimeout(load, 0); return () => clearTimeout(initial); }, [load]);

  const run = async (operation) => {
    try { setDemo(await operation()); setError(""); }
    catch { setError("Unable to update the Guided Demo state."); }
  };
  const start = () => run(startDemo);
  const next = () => run(() => advanceDemo(1));
  const previous = () => run(() => advanceDemo(-1));
  const restart = () => run(resetDemo);
  const exit = async () => { await run(exitDemo); };
  const step = demo?.step;
  const progress = demo ? ((demo.current_step + 1) / demo.total_steps) * 100 : 0;
  const stepLinks = {
    digital_twin: ["/digital-twin", "Open Digital Twin"],
    mission_scenario: ["/mission-command", "Open Mission Command"],
    smart_alert: ["/risk-alerts", "Review Risk Alerts"],
    mission_response: ["/mission-command", "Choose Response"],
    analytics: ["/health-analytics", "Open Analytics"],
    report: ["/mission-intelligence", "Open Reports"],
  };

  if (!demo) return error
    ? <PageFrame title="Guided demo" section="PRESENTATION EXPERIENCE"><div className="empty-state"><h2>Guided Demo unavailable</h2><p>{error}</p><button onClick={load}>Retry</button></div></PageFrame>
    : <main className="loading-screen"><p>Preparing Guided Demo...</p></main>;
  return (
    <PageFrame title="Guided demo" section="PRESENTATION EXPERIENCE" error={error} className={presentation ? "presentation-mode" : ""}>
      <section className="demo-hero"><div><p className="eyebrow">MARS CREW HEALTH DEMONSTRATION</p><h2>AstroHealth in eight steps</h2><p className="muted">A deterministic walkthrough for Team EAGLES. Seed {demo.seed} · simulated data only.</p></div><div className="demo-controls"><button onClick={() => setPresentation((value) => !value)}><Zap size={15} /> {presentation ? "Exit presentation" : "Presentation mode"}</button><button className="secondary" onClick={exit}><Square size={14} /> Exit Demo</button></div></section>
      <section className="demo-progress"><div><span>Step {demo.current_step + 1} of {demo.total_steps}</span><strong>{step.title}</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></section>
      {!demo.active ? <section className="demo-start-card"><Play size={28} /><h2>Start the reproducible mission demonstration</h2><p>This explicitly starts a deterministic preset and temporarily replaces the current mission state. Exit Demo restores the previous mission state, history, alerts, and events.</p><button className="command-button" onClick={start}>Start Demo</button></section> : <section className="demo-step-card"><div className="step-number">{demo.current_step + 1}</div><div><p className="eyebrow">CURRENT DEMO STEP</p><h2>{step.title}</h2><p>{step.description}</p><div className="demo-action-note"><CheckCircle2 size={16} /> {step.action}</div>{stepLinks[step.id] && <button className="demo-link" onClick={() => navigate(stepLinks[step.id][0])}><ExternalLink size={14} /> {stepLinks[step.id][1]}</button>}</div></section>}
      {demo.active && <section className="demo-live-grid"><article className="command-card"><p className="eyebrow">LIVE PRESET STATE</p><h3>{demo.mission.phase.replaceAll("_", " ")} · {demo.mission.scenario.replaceAll("_", " ")}</h3><div className="command-metrics">{[["Heart rate", demo.mission.health.heart_rate, "BPM"], ["Stress", demo.mission.health.stress_index, "index"], ["Fatigue", demo.mission.health.fatigue_index, "index"], ["Workload", demo.mission.health.workload_index, "index"]].map(([label, value, unit]) => <div className="command-metric" key={label}><span>{label}</span><strong>{value} <small>{unit}</small></strong></div>)}</div><p className="muted">T+{demo.mission.elapsed_hours}h · {demo.alert_count} real configured alert(s)</p></article><article className="command-card"><p className="eyebrow">DEMO STATUS PANEL</p>{status?.checks.map((item) => <div className="demo-status-row" key={item.id}><span className={`status-dot ${item.status.toLowerCase().replace(" ", "-")}`} /><strong>{item.name}</strong><em>{item.status}</em>{item.guidance && <small>{item.guidance}</small>}</div>)}</article></section>}
      {demo.active && <div className="demo-navigation"><button className="secondary" disabled={demo.current_step === 0} onClick={previous}><ArrowLeft size={15} /> Previous</button><button className="secondary" onClick={restart}><RotateCcw size={15} /> Restart Demo</button><button disabled={demo.current_step === demo.total_steps - 1} onClick={next}>Next Step <ArrowRight size={15} /></button></div>}
      <footer className="disclaimer">The preset is reproducible and educational. It does not contain NASA astronaut data, clinical predictions, or operational instructions.</footer>
    </PageFrame>
  );
}

export default GuidedDemo;
