import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, ChartNoAxesCombined, Clock3, Database, TrendingDown, TrendingUp } from "lucide-react";
import AnalyticsTrendChart from "../components/AnalyticsTrendChart";
import PageFrame from "./PageFrame";
import { getAnalyticsInsights, getAnalyticsSummary, getMissionHistory } from "../services/api";

const definitions = [
  { key: "heart_rate", label: "Heart rate", unit: "BPM", color: "#fb7185" },
  { key: "oxygen_saturation", label: "Oxygen saturation", unit: "%", color: "#22d3ee" },
  { key: "stress_index", label: "Stress index", unit: "index", color: "#a78bfa" },
  { key: "fatigue_index", label: "Fatigue index", unit: "index", color: "#f97316" },
  { key: "sleep_hours", label: "Sleep duration", unit: "hours", color: "#c084fc" },
];

const displayName = (value) => value.replaceAll("_", " ");

function buildChartData(history, prediction, anomaly) {
  const observed = history.map((measurement) => ({
    time: new Date(measurement.timestamp).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
    observed: measurement[prediction.metric],
    anomaly_value: null,
  }));
  if (anomaly?.status === "anomaly" && observed.length) {
    observed[observed.length - 1].anomaly_value = observed[observed.length - 1].observed;
  }
  if (prediction?.status !== "ready" || !observed.length) return observed;
  const latest = observed[observed.length - 1].observed;
  const predicted = prediction.predicted_value;
  const points = Array.from({ length: 3 }, (_, index) => ({
    time: `T+${index + 1}`,
    forecast: Number((latest + ((predicted - latest) * (index + 1)) / 3).toFixed(2)),
    anomaly_value: null,
  }));
  observed[observed.length - 1].forecast = latest;
  return [...observed, ...points];
}

function PredictionCard({ prediction, definition, latestValue }) {
  const hasPrediction = prediction?.status === "ready";
  const trend = hasPrediction && prediction.predicted_value >= latestValue ? TrendingUp : TrendingDown;
  const TrendIcon = hasPrediction ? trend : ChartNoAxesCombined;
  return (
    <article className="analytics-prediction-card">
      <div className="analytics-card-top"><p className="eyebrow">{definition.label}</p><TrendIcon size={17} /></div>
      <strong>{hasPrediction ? prediction.predicted_value : "Insufficient data"}</strong>
      {hasPrediction && <span>{definition.unit} · {prediction.forecast_horizon}</span>}
      <p>{prediction?.explanation || "No prediction is available from the current history."}</p>
    </article>
  );
}

function HealthAnalytics() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextSummary, nextHistory, nextInsights] = await Promise.all([
        getAnalyticsSummary(),
        getMissionHistory(),
        getAnalyticsInsights(),
      ]);
      setSummary(nextSummary);
      setHistory(nextHistory);
      setInsights(nextInsights);
      setError("");
    } catch {
      setError("Analytics API is unavailable. Start the FastAPI backend to view simulated trends.");
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(load, 0);
    const timer = setInterval(load, 3000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [load]);

  const predictionMap = useMemo(() => new Map((summary?.predictions || []).map((item) => [item.metric, item])), [summary]);
  const anomalyMap = useMemo(() => new Map((summary?.anomalies || []).map((item) => [item.metric, item])), [summary]);
  const activeAlerts = (summary?.alerts || []).filter((alert) => !alert.acknowledged);
  const acknowledgedAlerts = (summary?.alerts || []).filter((alert) => alert.acknowledged);
  const latestValues = history.length ? history[history.length - 1] : {};

  return (
    <PageFrame title="AI health analytics" section="AI ANALYTICS" error={error}>
      <section className="analytics-header">
        <div><p className="eyebrow">EXPLAINABLE SIMULATED HEALTH ANALYTICS</p><h2>{displayName(summary?.scenario || "Synchronizing mission state")}</h2><p className="muted">Mission phase: {displayName(summary?.phase || "pending")}</p></div>
        <div className="analytics-quality"><Database size={16} /><span>{summary?.observations ?? 0} observations · {summary?.data_quality || "insufficient"} data quality</span></div>
      </section>

      <div className="section-heading"><div><p className="eyebrow">SHORT-TERM TREND ESTIMATES</p><h2>Prediction cards</h2></div><p className="updated"><Clock3 size={14} /> Refreshes every 3 seconds</p></div>
      <section className="analytics-predictions">{definitions.map((definition) => <PredictionCard key={definition.key} definition={definition} prediction={predictionMap.get(definition.key)} latestValue={latestValues[definition.key]} />)}</section>

      <div className="section-heading"><div><p className="eyebrow">OBSERVED + FORECAST</p><h2>Historical trend charts</h2></div><span className="data-badge">DASHED = EXPERIMENTAL FORECAST</span></div>
      <section className="charts-grid analytics-charts">{definitions.map((definition) => <AnalyticsTrendChart key={definition.key} definition={definition} data={buildChartData(history, predictionMap.get(definition.key), anomalyMap.get(definition.key))} forecastBoundary={history.length ? new Date(history[history.length - 1].timestamp).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }) : ""} />)}</section>

      <section className="analytics-lower-grid">
        <article className="analytics-panel"><div className="panel-title"><AlertTriangle size={17} /><h3>Statistical anomalies</h3></div>{summary?.anomalies?.filter((item) => item.status === "anomaly").length ? summary.anomalies.filter((item) => item.status === "anomaly").map((item) => <div className="analytics-list-item" key={item.metric}><strong>{displayName(item.metric)}</strong><span>{item.observed_value} · rolling mean {item.rolling_mean}</span><p>{item.explanation}</p></div>) : <div className="analytics-empty">No statistical anomalies detected in the current window.</div>}</article>
        <article className="analytics-panel"><div className="panel-title"><ShieldIcon /><h3>Smart alerts</h3></div>{activeAlerts.length ? activeAlerts.map((alert) => <div className="analytics-list-item" key={alert.id}><strong>{alert.severity} · {displayName(alert.metric)}</strong><span>{alert.observed_value} {alert.unit} · {alert.rule}</span><p>{alert.explanation}</p></div>) : <div className="analytics-empty">No active demonstration alerts.</div>}<small className="analytics-history-note">{acknowledgedAlerts.length} acknowledged alert(s) in history.</small></article>
      </section>

      <section className="insights-panel"><div className="panel-title"><BrainCircuit size={17} /><h3>{insights?.title || "AstroHealth Insights"}</h3></div><p className="insights-summary">{insights?.summary || "Waiting for synchronized mission measurements."}</p><div className="insights-columns"><div><p className="eyebrow">SCENARIO FACTORS</p>{(insights?.factors || []).map((factor) => <p key={factor}>· {factor}</p>)}</div><div><p className="eyebrow">LIMITATIONS</p>{(insights?.limitations || []).map((limitation) => <p key={limitation}>· {limitation}</p>)}</div></div></section>
      <footer className="disclaimer"><ChartNoAxesCombined size={16} /><span>{summary?.disclaimer || "Simulated, experimental analytics only; not clinically validated or medical advice."}</span></footer>
    </PageFrame>
  );
}

function ShieldIcon() {
  return <AlertTriangle size={17} />;
}

export default HealthAnalytics;
