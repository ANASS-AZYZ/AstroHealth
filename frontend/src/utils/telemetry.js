export const chartDefinitions = [
  { key: "heart_rate", label: "Heart rate", unit: "BPM", color: "#fb7185", type: "line" },
  { key: "oxygen_level", label: "Oxygen saturation", unit: "%", color: "#22d3ee", type: "line" },
  { key: "stress_level", label: "Stress index", unit: "index", color: "#a78bfa", type: "line" },
  { key: "sleep_hours", label: "Sleep duration", unit: "hours", color: "#818cf8", type: "area" },
  { key: "radiation", label: "Radiation exposure", unit: "mSv/day", color: "#fbbf24", type: "line" },
];

export const formatTime = (timestamp) => timestamp
  ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  : "--";
