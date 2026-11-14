import { Activity, CirclePause, CirclePlay, Clock3, HeartPulse, Moon, Radio, RefreshCw, ShieldCheck } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { HealthCharts } from "./components/HealthCharts";
import { useTelemetry } from "./hooks/useTelemetry";
import AstronautHealth from "./pages/AstronautHealth";
import LiveMonitoring from "./pages/LiveMonitoring";
const MissionSimulator = lazy(() => import("./pages/MissionSimulator"));
const DigitalTwin = lazy(() => import("./pages/DigitalTwin"));
const HealthAnalytics = lazy(() => import("./pages/HealthAnalytics"));
import PageFrame from "./pages/PageFrame";
import RiskAlerts from "./pages/RiskAlerts";
import { initializeSession } from "./services/api";
const MissionIntelligence = lazy(() => import("./pages/MissionIntelligence"));
const MissionCommand = lazy(() => import("./pages/MissionCommand"));
const GuidedDemo = lazy(() => import("./pages/GuidedDemo"));
import ScientificEvidence from "./pages/ScientificEvidence";
import About from "./pages/About";

function MetricCard({ icon: Icon, label, value, unit, color }) {
  return <article className="metric-card"><div className={`metric-icon ${color}`}><Icon size={20} /></div><p className="eyebrow">{label}</p><div className="metric-value">{value ?? "--"} <span>{unit}</span></div><p className="metric-caption">Illustrative simulation</p></article>;
}

function MissionOverview() {
  const telemetry = useTelemetry();
  const navigate = useNavigate();
  if (telemetry.isLoading && !telemetry.astronaut) return <main className="loading-screen"><div className="loading-mark"><Activity size={26} /></div><p>Initializing mission telemetry...</p></main>;
  const metrics = [
    { label: "Heart rate", value: telemetry.health?.heart_rate, unit: "BPM", icon: HeartPulse, color: "rose" },
    { label: "Oxygen saturation", value: telemetry.health?.oxygen_level, unit: "%", icon: Activity, color: "cyan" },
    { label: "Sleep duration", value: telemetry.health?.sleep_hours, unit: "hours", icon: Moon, color: "violet" },
    { label: "Radiation exposure", value: telemetry.health?.radiation, unit: "mSv/day", icon: Radio, color: "amber" },
  ];
  return (
    <PageFrame title="Health telemetry" section="OVERVIEW" error={telemetry.error}>
      <section className="info-hero">
        <p className="eyebrow">TEAM EAGLES · ASTROHEALTH</p>
        <div className="controls">
          <button onClick={() => navigate("/guided-demo")}><CirclePlay size={16} /> Start Guided Demo</button>
          <button className="secondary" onClick={() => navigate("/scientific-evidence")}><ShieldCheck size={16} /> Scientific limitations</button>
        </div>
      </section>
      <section className="mission-banner"><div><p className="eyebrow">ACTIVE MISSION</p><h2>{telemetry.astronaut?.mission || "Mars Exploration"}</h2><p className="muted">{telemetry.astronaut?.name || "Alex Morgan"} · Flight specialist · Day 184</p></div><div className="mission-status"><span className={`status-pulse ${telemetry.error ? "status-offline" : ""}`} /> {telemetry.error ? "DISCONNECTED" : "SIMULATED TELEMETRY"}</div></section>
      <div className="section-heading"><div><p className="eyebrow">CURRENT READINGS</p><h2>Physiological indicators</h2></div><p className="updated"><Clock3 size={14} /> Updated {telemetry.health?.timestamp ? new Date(telemetry.health.timestamp).toLocaleTimeString() : "--"}</p></div>
      <section className="metrics-grid">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>
      <div className="section-heading charts-heading"><div><p className="eyebrow">LIVE STREAM</p><h2>Telemetry trends</h2></div><div className="controls"><button onClick={() => telemetry.setIsRunning((running) => !running)}>{telemetry.isRunning ? <CirclePause size={16} /> : <CirclePlay size={16} />}{telemetry.isRunning ? "Pause" : "Resume"}</button><button onClick={telemetry.reset} className="secondary"><RefreshCw size={15} /> Reset</button></div></div>
      <HealthCharts
        data={telemetry.chartData}
        emptyMessage={telemetry.error || "Simulation not started. Start the Mission Simulator to generate telemetry."}
      />
      <footer className="disclaimer"><ShieldCheck size={16} /><span>Demonstration only. Measurements are simulated and are not clinical readings or medical advice.</span></footer>
    </PageFrame>
  );
}

function NotFound() {
  return <PageFrame title="Route not found" section="ERROR"><div className="empty-state"><h2>404 · Mission page unavailable</h2><p>Use the sidebar to return to a supported AstroHealth view.</p></div></PageFrame>;
}

function RouteLoading() {
  return <main className="loading-screen"><div className="loading-mark"><Activity size={26} /></div><p>Loading mission module...</p></main>;
}

function App() {
  const [sessionState, setSessionState] = useState("connecting");

  useEffect(() => {
    initializeSession()
      .then(() => setSessionState("ready"))
      .catch(() => setSessionState("error"));
  }, []);

  if (sessionState === "connecting") return <main className="loading-screen"><p>Connecting to the AstroHealth API...</p></main>;
  if (sessionState === "error") return <main className="loading-screen"><p>Unable to establish an AstroHealth session.</p><button onClick={() => { setSessionState("connecting"); initializeSession().then(() => setSessionState("ready")).catch(() => setSessionState("error")); }}>Retry connection</button></main>;
  return (
    <Suspense fallback={<RouteLoading />}><Routes>
      <Route path="/" element={<MissionOverview />} />
      <Route path="/astronaut-health" element={<AstronautHealth />} />
      <Route path="/live-monitoring" element={<LiveMonitoring />} />
      <Route path="/risk-alerts" element={<RiskAlerts />} />
      <Route path="/mission-simulator" element={<MissionSimulator />} />
      <Route path="/digital-twin" element={<DigitalTwin />} />
      <Route path="/health-analytics" element={<HealthAnalytics />} />
      <Route path="/mission-intelligence" element={<MissionIntelligence />} />
      <Route path="/mission-command" element={<MissionCommand />} />
      <Route path="/guided-demo" element={<GuidedDemo />} />
      <Route path="/scientific-evidence" element={<ScientificEvidence />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes></Suspense>
  );
}

export default App;
