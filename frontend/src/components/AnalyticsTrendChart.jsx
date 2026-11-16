import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../context/useTheme";

function AnalyticsTrendChart({ definition, data, forecastBoundary }) {
  const { resolvedTheme } = useTheme();
  const chartTheme = resolvedTheme === "light"
    ? { grid: "#cbd5e1", axis: "#64748b", tooltip: "#ffffff", tooltipBorder: "#cbd5e1", label: "#475569" }
    : { grid: "#1e293b", axis: "#94a3b8", tooltip: "#0f172a", tooltipBorder: "#334155", label: "#94a3b8" };
  return (
    <article className="chart-card analytics-chart-card">
      <div className="chart-heading">
        <div>
          <p className="eyebrow">{definition.label}</p>
          <p className="chart-unit">{definition.unit}</p>
        </div>
        <div className="analytics-legend">
          <span><i className="legend-observed" /> Observed</span>
          <span><i className="legend-forecast" /> Forecast</span>
        </div>
      </div>
      {data.length === 0 ? <div className="chart-empty">Waiting for mission measurements...</div> : (
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: chartTheme.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: chartTheme.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={42} />
            <Tooltip
              contentStyle={{ background: chartTheme.tooltip, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 10 }}
              labelStyle={{ color: chartTheme.label }}
              formatter={(value, name) => [value == null ? "--" : `${value} ${definition.unit}`, name === "forecast" ? "Experimental forecast" : definition.label]}
            />
            <Line isAnimationActive={false} type="monotone" dataKey="observed" stroke={definition.color} strokeWidth={2} dot={data.filter((point) => point.observed != null).length === 1 ? { r: 3 } : false} connectNulls={false} />
            <Line isAnimationActive={false} type="monotone" dataKey="forecast" stroke={definition.color} strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} />
            <Scatter isAnimationActive={false} dataKey="anomaly_value" fill="#fb7185" line={false} />
            {forecastBoundary && <ReferenceLine x={forecastBoundary} stroke={chartTheme.axis} strokeDasharray="3 3" label={{ value: "FORECAST", fill: chartTheme.label, fontSize: 9, position: "insideTopRight" }} />}
          </LineChart>
        </ResponsiveContainer>
      )}
    </article>
  );
}

export default AnalyticsTrendChart;
