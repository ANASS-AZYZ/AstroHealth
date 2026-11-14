import { CirclePause, CirclePlay, RefreshCw } from "lucide-react";
import { HealthCharts } from "../components/HealthCharts";
import PageFrame from "./PageFrame";
import { useTelemetry } from "../hooks/useTelemetry";

function LiveMonitoring() {
  const telemetry = useTelemetry();
  if (telemetry.isLoading && !telemetry.astronaut) return <main className="loading-screen"><p>Initializing live telemetry...</p></main>;
  return (
    <PageFrame title="Live monitoring" section="LIVE MONITORING" error={telemetry.error}>
      <section className="mission-banner"><div><p className="eyebrow">REAL-TIME SIMULATION STREAM</p><h2>{telemetry.astronaut?.mission || "Mars Exploration"}</h2><p className="muted">Updates every 5 seconds · Last update: {telemetry.health?.timestamp ? new Date(telemetry.health.timestamp).toLocaleTimeString() : "--"}</p></div><div className="mission-status"><span className={`status-pulse ${telemetry.error ? "status-offline" : ""}`} /> {telemetry.error ? "DISCONNECTED" : "STREAMING SIMULATED DATA"}</div></section>
      <div className="section-heading charts-heading"><div><p className="eyebrow">TELEMETRY</p><h2>Live health indicators</h2></div><div className="controls"><button onClick={() => telemetry.setIsRunning((running) => !running)}>{telemetry.isRunning ? <CirclePause size={16} /> : <CirclePlay size={16} />}{telemetry.isRunning ? "Pause" : "Resume"}</button><button className="secondary" onClick={telemetry.reset}><RefreshCw size={15} /> Clear Chart</button></div></div>
      <HealthCharts data={telemetry.chartData} />
      <footer className="disclaimer">Pause stops polling on this page. Data is simulated and not clinically validated.</footer>
    </PageFrame>
  );
}

export default LiveMonitoring;
