import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Clock3, MessageSquare, RotateCcw, Send, Siren } from "lucide-react";
import PageFrame from "./PageFrame";
import {
  activateCommandScenario, commandDownloadUrl, getCommandScenarios, getCommandState,
  getCommandEvents, respondToCommandScenario, resetCommand, sendCommandMessage,
} from "../services/api";

const metricLabels = {
  heart_rate: ["Heart rate", "BPM"], oxygen_saturation: ["Oxygen saturation", "%"],
  sleep_hours: ["Sleep duration", "hours"], stress_index: ["Stress", "index"],
  fatigue_index: ["Fatigue", "index"], workload_index: ["Workload", "index"],
  radiation_dose_rate: ["Radiation rate", "mSv/day"],
};

function MissionCommand() {
  const [command, setCommand] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    try { const [state, eventData] = await Promise.all([getCommandState(), getCommandEvents()]); setCommand(state); setEvents(eventData); setError(""); }
    catch { setError("Unable to load command center state."); }
  }, []);
  useEffect(() => {
    const initialize = async () => {
      try {
        const [state, data, eventData] = await Promise.all([getCommandState(), getCommandScenarios(), getCommandEvents()]);
        setCommand(state); setScenarios(data); setEvents(eventData); setSelected(data[0]?.id || "");
      } catch { setError("Unable to initialize command center."); }
    };
    initialize();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [refresh]);

  const activate = async () => {
    try { setCommand(await activateCommandScenario(selected)); setError(""); }
    catch { setError("Unable to activate the selected demonstration scenario."); }
  };
  const respond = async (actionId) => {
    try { setCommand(await respondToCommandScenario(actionId)); setError(""); }
    catch { setError("That response is not available for the active scenario."); }
  };
  const sendMessage = async () => {
    if (!message.trim()) return;
    try { await sendCommandMessage(message.trim()); setMessage(""); await refresh(); }
    catch { setError("Unable to queue the demonstration message."); }
  };
  const reset = async () => {
    try { setCommand(await resetCommand()); setEvents([]); setError(""); }
    catch { setError("Unable to reset the command scenario."); }
  };
  const mission = command?.mission;
  const active = command?.active_scenario;
  const initial = command?.initial_measurements;
  const consequence = command?.last_consequence;

  if (!command) return error
    ? <PageFrame title="Mission command center" section="COMMAND / EMERGENCY RESPONSE"><div className="empty-state"><h2>Command center unavailable</h2><p>{error}</p><button onClick={refresh}>Retry</button></div></PageFrame>
    : <main className="loading-screen"><p>Initializing mission command center...</p></main>;
  return (
    <PageFrame title="Mission command center" section="COMMAND / EMERGENCY RESPONSE" error={error}>
      <section className="command-header"><div><p className="eyebrow">ACTIVE MISSION</p><h2>Mars Exploration · {mission.phase.replaceAll("_", " ")}</h2><p className="muted"><Clock3 size={13} /> T+{mission.elapsed_hours} simulated hours · {mission.status.toUpperCase()} · {mission.scenario.replaceAll("_", " ")}</p></div><div className="command-status"><Siren size={18} /> DEMONSTRATION RESPONSE MODE <button className="secondary" onClick={reset}><RotateCcw size={14} /> Reset</button></div></section>
      <section className="command-grid">
        <article className="command-card scenario-panel"><div className="panel-title"><Siren size={17} /><h3>Emergency scenario</h3></div><label>Scenario<select value={selected} onChange={(event) => setSelected(event.target.value)}>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select></label><button className="command-button" onClick={activate}>Activate scenario</button>{active ? <div className="scenario-detail"><p className="eyebrow">{active.name}</p><p>{active.description}</p><small>{active.starting_conditions.join(" · ")}</small><div className="tag-list">{active.affected_indicators.map((item) => <span key={item}>{item.replaceAll("_", " ")}</span>)}</div></div> : <p className="muted">No emergency scenario active.</p>}</article>
        <article className="command-card"><div className="panel-title"><AlertTriangle size={17} /><h3>Astronaut status</h3></div><div className="command-metrics">{Object.entries(metricLabels).map(([key, [label, unit]]) => <div className="command-metric" key={key}><span>{label}</span><strong>{mission.health[key]} <small>{unit}</small></strong></div>)}</div><div className="tag-list">{mission.environmental_conditions.concat(mission.active_stressors).map((item) => <span key={item}>{item}</span>)}</div>{mission.alerts.length > 0 && <div className="command-alerts">{mission.alerts.map((alert) => <p key={`${alert.metric}-${alert.threshold}`}><AlertTriangle size={13} /> {alert.message}</p>)}</div>}</article>
      </section>
      <section className="command-grid">
        <article className="command-card"><div className="panel-title"><Siren size={17} /><h3>Response actions</h3></div>{active ? <div className="response-actions">{active.actions.map((action) => <button key={action.id} onClick={() => respond(action.id)}><strong>{action.name}</strong><span>{action.description}</span></button>)}</div> : <p className="muted">Activate a scenario to see context-specific actions.</p>}</article>
        <article className="command-card"><div className="panel-title"><RotateCcw size={17} /><h3>Consequence monitor</h3></div>{consequence ? <><p className="muted">{consequence.action_name} · {consequence.explanation}</p><div className="comparison-table">{Object.entries(consequence.changed).map(([key, change]) => <div className="comparison-row" key={key}><span>{metricLabels[key]?.[0] || key}</span><strong>{initial?.[key]}</strong><strong>{consequence.after[key]}</strong><em>{change > 0 ? "+" : ""}{change}</em></div>)}</div></> : <p className="muted">Selected response consequences will appear here with before-and-after values.</p>}</article>
      </section>
      <section className="command-card communication-card"><div className="panel-title"><MessageSquare size={17} /><h3>Earth Mission Control ↔ Spacecraft</h3></div><p className="muted">Communication delay is controlled by simulated mission time, not network latency.</p><div className="message-compose"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Demonstration status request" /><button onClick={sendMessage}><Send size={14} /> Queue message</button></div><div className="messages">{command.messages.map((item) => <div key={item.id}><strong>{item.delivered ? "DELIVERED" : "PENDING"}</strong><span>{item.text}</span><small>T+{item.sent_at_mission_hour}h → T+{item.delivery_at_mission_hour}h</small></div>)}{!command.messages.length && <p className="muted">No demonstration messages queued.</p>}</div></section>
      <section className="command-card"><div className="section-heading"><div><p className="eyebrow">CHRONOLOGICAL HISTORY</p><h2>Mission events</h2></div><div className="export-actions"><a href={commandDownloadUrl("after-action.pdf")} download>After-action PDF</a><a href={commandDownloadUrl("after-action.json")} download>After-action JSON</a></div></div><div className="intelligence-events">{events.slice(0, 12).map((event) => <div key={event.id}><strong>{event.event_type.replaceAll("_", " ")}</strong><span>T+{event.mission_timestamp}h · {event.description}</span></div>)}{!events.length && <p className="muted">No mission events recorded yet.</p>}</div></section>
      <footer className="disclaimer">All scenarios, indicators, effects, and response actions are educational simulations. They are not medical instructions, spacecraft procedures, or validated predictions.</footer>
    </PageFrame>
  );
}

export default MissionCommand;
