import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { chartDefinitions } from "../utils/telemetry";
import { useTheme } from "../context/useTheme";

export function HealthChart({ definition, data, emptyMessage }) {
  const { resolvedTheme } = useTheme();
  const chartTheme = resolvedTheme === "light"
    ? { grid: "#cbd5e1", axis: "#64748b", tooltip: "#ffffff", tooltipBorder: "#cbd5e1", label: "#475569" }
    : { grid: "#1e293b", axis: "#94a3b8", tooltip: "#0f172a", tooltipBorder: "#334155", label: "#94a3b8" };
  const Chart = definition.type === "area" ? AreaChart : LineChart;
  return (
    <article className="chart-card">
      <div className="chart-heading"><div><p className="eyebrow">{definition.label}</p><p className="chart-unit">{definition.unit}</p></div><span className="chart-dot" style={{ backgroundColor: definition.color }} /></div>
      {data.length === 0 ? <div className="chart-empty">{emptyMessage}</div> : (
        <ResponsiveContainer width="100%" height={190}>
          <Chart data={data}>
            <defs><linearGradient id={`fill-${definition.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={definition.color} stopOpacity={0.3} /><stop offset="100%" stopColor={definition.color} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: chartTheme.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: chartTheme.axis, fontSize: 11 }} tickLine={false} axisLine={false} width={38} />
            <Tooltip contentStyle={{ background: chartTheme.tooltip, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 10 }} labelStyle={{ color: chartTheme.label }} formatter={(value) => [`${value} ${definition.unit}`, definition.label]} />
            {definition.type === "area"
              ? <Area isAnimationActive={false} type="monotone" dataKey={definition.key} stroke={definition.color} fill={`url(#fill-${definition.key})`} strokeWidth={2} dot={data.length === 1 ? { r: 3 } : false} />
              : <Line isAnimationActive={false} type="monotone" dataKey={definition.key} stroke={definition.color} strokeWidth={2} dot={data.length === 1 ? { r: 3 } : false} activeDot={{ r: 4 }} />}
          </Chart>
        </ResponsiveContainer>
      )}
    </article>
  );
}

export function HealthCharts({ data, emptyMessage = "Waiting for the first measurement..." }) {
  return <section className="charts-grid">{chartDefinitions.map((definition) => <HealthChart key={definition.key} definition={definition} data={data} emptyMessage={emptyMessage} />)}</section>;
}
