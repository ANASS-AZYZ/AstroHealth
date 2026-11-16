import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Clock3, Gauge, Play, RotateCcw, Square, TriangleAlert } from "lucide-react";
import { HealthCharts } from "../components/HealthCharts";
import PageFrame from "./PageFrame";
import {
  getMissionHistory, getMissionPhases, getMissionScenarios, getMissionState,
  pauseMission, resetMission, resumeMission, setMissionPhase, setMissionScenario, setMissionSpeed,
  startMission,
} from "../services/api";

function MissionSimulator() {
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [phases, setPhases] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [missionState, missionHistory, scenarioData, phaseData] = await Promise.all([getMissionState(), getMissionHistory(), getMissionScenarios(), getMissionPhases()]);
      setState(missionState); setHistory(missionHistory); setScenarios(scenarioData); setPhases(phaseData); setError("");
    } catch { setError("Unable to initialize the mission simulator."); }
  }, []);
  useEffect(() => { const initial = setTimeout(load, 0); return () => clearTimeout(initial); }, [load]);

  // The session clock advances independently of the current route.
  useEffect(() => {
    let active = true;
    let pending = false;
    const timer = setInterval(async () => {
      if (pending) return;
      pending = true;
      try {
        const [next, nextHistory] = await Promise.all([getMissionState(), getMissionHistory()]);
        if (active) { setState(next); setHistory(nextHistory); }
      } catch { if (active) setError("Mission telemetry update failed."); }
      finally { pending = false; }
    }, 1000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const command = async (action) => {
    try { setState(await action()); setError(""); } catch { setError("Unable to update mission state."); }
  };
  const selectScenario = async (event) => command(() => setMissionScenario(event.target.value));
  const selectSpeed = async (event) => command(() => setMissionSpeed(Number(event.target.value)));
  const chartData = useMemo(() => (history.length ? history : state?.health ? [state.health] : []).map((item) => ({ ...item, oxygen_level: item.oxygen_saturation, stress_level: item.stress_index, sleep_hours: item.sleep_hours, radiation: item.radiation_dose_rate, time: `T${item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }) : "--"}` })), [history, state]);
  const scenario = scenarios.find((item) => item.id === state?.scenario);

  if (!state) return error
    ? <PageFrame title="Mars mission simulator" section="MISSION SIMULATOR"><div className="empty-state"><h2>Mission simulator unavailable</h2><p>{error}</p><button onClick={load}>Retry</button></div></PageFrame>
    : <main className="loading-screen"><p>Initializing Mars mission simulation...</p></main>;
  return (
    <PageFrame title="Mars mission simulator" section="MISSION SIMULATOR" error={error}>
      <section className="simulator-header"><div><p className="eyebrow">MARS EXPLORATION / DIGITAL MISSION</p><h2>{phases.find((phase) => phase.id === state.phase)?.name}</h2><p className="muted">Mission day {state.mission_day} · {state.elapsed_hours} simulated hours</p></div><div className={`sim-status status-${state.status}`}><span /> {state.status.toUpperCase()}</div></section>
      <section className="phase-timeline">{phases.map((phase, index) => <button key={phase.id} className={`phase-step ${phase.id === state.phase ? "current" : ""}`} onClick={() => command(() => setMissionPhase(phase.id))}><span>{index + 1}</span><small>{phase.name}</small></button>)}</section>
      <section className="simulator-grid">
        <div className="sim-control-panel"><div className="panel-title"><Gauge size={17} /><h3>Simulation controls</h3></div><label>Scenario<select value={state.scenario} onChange={selectScenario}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Simulation speed<select value={state.speed} onChange={selectSpeed}>{[1, 5, 10, 50].map((speed) => <option key={speed} value={speed}>{speed}x</option>)}</select></label><div className="controls sim-buttons"><button onClick={() => command(startMission)}><Play size={15} /> Start</button><button onClick={() => command(pauseMission)}><Square size={15} /> Pause</button><button onClick={() => command(resumeMission)}><Play size={15} /> Resume</button><button className="secondary" onClick={() => command(async () => { const next = await resetMission(); setHistory([]); return next; })}><RotateCcw size={15} /> Reset</button></div><div className="scenario-explanation"><p className="eyebrow">ACTIVE SCENARIO</p><h3>{scenario?.name}</h3><p>{scenario?.description}</p><small>Illustrative assumptions only; not a validated physiological model.</small></div></div>
        <div className="sim-health-panel"><div className="panel-title"><Activity size={17} /><h3>Live mission telemetry</h3><span className="data-badge">SIMULATED</span></div><div className="sim-metrics">{Object.entries({ "Heart rate": [state.health.heart_rate, "BPM"], "Oxygen": [state.health.oxygen_saturation, "%"], "Sleep": [state.health.sleep_hours, "hours"], "Stress": [state.health.stress_index, "index"], "Fatigue": [state.health.fatigue_index, "index"], "Workload": [state.health.workload_index, "index"], "Radiation": [state.health.radiation_dose_rate, "mSv/day"] }).map(([label, [value, unit]]) => <div className="sim-metric" key={label}><span>{label}</span><strong>{value} <small>{unit}</small></strong></div>)}</div><div className="environment-list"><p className="eyebrow">ENVIRONMENTAL CONDITIONS</p>{state.active_stressors.map((item) => <span key={item}>{item}</span>)}</div></div>
      </section>
      <div className="section-heading"><div><p className="eyebrow">SIMULATION HISTORY</p><h2>Telemetry trends</h2></div><p className="updated"><Clock3 size={14} /> {history.length} observations</p></div>
      <HealthCharts data={chartData} />
      <section className="event-panel"><div className="panel-title"><TriangleAlert size={17} /><h3>Mission events and alerts</h3></div>{state.alerts.length ? state.alerts.map((alert) => <p key={`${alert.metric}-${alert.timestamp}`}><TriangleAlert size={14} /> {alert.message}</p>) : <p className="muted">No configured demonstration thresholds triggered.</p>}</section>
      <footer className="disclaimer">Mission time is simulated and separate from wall-clock time. Radiation is an illustrative environmental dose-rate indicator in mSv/day; it is not mission data.</footer>
    </PageFrame>
  );
}

export default MissionSimulator;
