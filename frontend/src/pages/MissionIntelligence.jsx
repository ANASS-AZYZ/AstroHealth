import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, GitCompare, List, ShieldCheck } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageFrame from "./PageFrame";
import {
  compareMissionScenarios, getMissionEvents, getMissionReadiness, getMissionScenarios,
  getMissionState, intelligenceDownloadUrl, missionHealthReportUrl,
} from "../services/api";

const labels = {
  heart_rate: "Heart rate",
  oxygen_saturation: "Oxygen saturation",
  sleep_hours: "Sleep duration",
  stress_index: "Stress index",
  fatigue_index: "Fatigue index",
  workload_index: "Workload index",
  radiation_dose_rate: "Radiation dose rate",
};

function MissionIntelligence() {
  const [state, setState] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [events, setEvents] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selected, setSelected] = useState(["nominal", "sleep_disruption"]);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
      try {
        const [missionState, score, eventData, scenarioData] = await Promise.all([
          getMissionState(), getMissionReadiness(), getMissionEvents(), getMissionScenarios(),
        ]);
        setState(missionState); setReadiness(score); setEvents(eventData); setScenarios(scenarioData); setError("");
      } catch {
        setError("Unable to load mission intelligence data.");
      }
  }, []);

  useEffect(() => {
    const initial = setTimeout(refresh, 0);
    const timer = setInterval(refresh, 3000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [refresh]);

  const runComparison = async () => {
    try { setComparison(await compareMissionScenarios(selected[0], selected[1])); setError(""); }
    catch { setError("Unable to compare the selected scenarios."); }
  };
  const chartData = useMemo(() => comparison?.series || [], [comparison]);
  const scenarioName = (id) => scenarios.find((item) => item.id === id)?.name || id;

  if (!state) return error
    ? <PageFrame title="Mission intelligence" section="INTELLIGENCE"><div className="empty-state"><h2>Mission intelligence unavailable</h2><p>{error}</p><button onClick={refresh}>Retry</button></div></PageFrame>
    : <main className="loading-screen"><p>Initializing mission intelligence...</p></main>;
  return (
    <PageFrame title="Mission intelligence" section="INTELLIGENCE" error={error}>
      <section className="intelligence-summary">
        <div><p className="eyebrow">MISSION SUMMARY</p><h2>Mars Exploration</h2><p className="muted">Alex Morgan · {state.mission_day} mission days · {state.elapsed_hours} simulated hours</p></div>
        <div className="intelligence-context"><span>{state.phase.replaceAll("_", " ")}</span><strong>{scenarioName(state.scenario)}</strong><small>{state.status.toUpperCase()}</small></div>
      </section>
      <section className="intelligence-grid">
        <article className="intelligence-card readiness-card"><div className="panel-title"><ShieldCheck size={17} /><h3>Mission readiness</h3></div><div className="readiness-score">{readiness?.score ?? "--"}<small>/100</small></div><strong>{readiness?.category}</strong><p>Demonstration score using fatigue, stress, sleep, workload, and active alerts.</p></article>
        <article className="intelligence-card"><div className="panel-title"><List size={17} /><h3>Recent mission events</h3></div><div className="intelligence-events">{events.slice(0, 6).map((event) => <div key={event.id}><strong>{event.event_type.replaceAll("_", " ")}</strong><span>T+{event.mission_timestamp}h · {event.description}</span></div>)}{!events.length && <p className="muted">No mission events recorded yet.</p>}</div></article>
      </section>
      <section className="intelligence-card comparison-card">
        <div className="section-heading"><div><p className="eyebrow">ISOLATED DETERMINISTIC RUNS</p><h2>Scenario comparison</h2></div><div className="controls"><select value={selected[0]} onChange={(event) => setSelected([event.target.value, selected[1]])}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={selected[1]} onChange={(event) => setSelected([selected[0], event.target.value])}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={runComparison}><GitCompare size={15} /> Compare</button></div></div>
        {!comparison ? <p className="muted">Select two scenarios to compare the same {12} simulated ticks and baseline.</p> : <><div className="comparison-table">{comparison.metrics.map((metric) => <div className="comparison-row" key={metric.metric}><span>{labels[metric.metric]} <small>{metric.unit}</small></span><strong>{metric.scenario_a}</strong><strong>{metric.scenario_b}</strong><em>{metric.absolute_difference > 0 ? "+" : ""}{metric.absolute_difference}{metric.percentage_difference == null ? "" : ` (${metric.percentage_difference}%)`}</em></div>)}</div><div className="comparison-chart"><ResponsiveContainer width="100%" height={230}><LineChart data={chartData}><XAxis dataKey="tick" /><YAxis /><Tooltip /><Line isAnimationActive={false} type="monotone" dataKey="scenario_a" name={scenarioName(selected[0])} stroke="#22d3ee" dot={false} /><Line isAnimationActive={false} type="monotone" dataKey="scenario_b" name={scenarioName(selected[1])} stroke="#a78bfa" dot={false} /></LineChart></ResponsiveContainer></div><p className="disclaimer">{comparison.explanation}</p></>}
      </section>
      <section className="intelligence-card"><div className="panel-title"><Download size={17} /><h3>Data export center</h3></div><div className="export-actions"><a href={missionHealthReportUrl()} download><FileText size={15} /> Download health report PDF</a><a href={intelligenceDownloadUrl("telemetry.csv")} download><Download size={15} /> Telemetry CSV</a><a href={intelligenceDownloadUrl("telemetry.json")} download><Download size={15} /> Telemetry JSON</a><a href={intelligenceDownloadUrl("events.json")} download><Download size={15} /> Events and alerts JSON</a></div><p className="muted">Exports contain simulated session data stored until session expiration. Export before resetting your mission.</p></section>
    </PageFrame>
  );
}

export default MissionIntelligence;
