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

function AnalyticsTrendChart({ definition, data, forecastBoundary }) {
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
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} width={42} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value, name) => [value == null ? "--" : `${value} ${definition.unit}`, name === "forecast" ? "Experimental forecast" : definition.label]}
            />
            <Line type="monotone" dataKey="observed" stroke={definition.color} strokeWidth={2} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke={definition.color} strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} />
            <Scatter dataKey="anomaly_value" fill="#fb7185" line={false} />
            {forecastBoundary && <ReferenceLine x={forecastBoundary} stroke="#64748b" strokeDasharray="3 3" label={{ value: "FORECAST", fill: "#94a3b8", fontSize: 9, position: "insideTopRight" }} />}
          </LineChart>
        </ResponsiveContainer>
      )}
    </article>
  );
}

export default AnalyticsTrendChart;
