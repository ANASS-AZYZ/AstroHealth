
import { useEffect, useState } from "react";
import { getHealth, getAstronaut } from "./services/api";
import {
  Activity,
  HeartPulse,
  Moon,
  Radiation,
  ShieldCheck,
} from "lucide-react";

function App() {
  const [health, setHealth] = useState(null);
  const [astronaut, setAstronaut] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [healthData, astronautData] = await Promise.all([
          getHealth(),
          getAstronaut(),
        ]);
        setHealth(healthData);
        setAstronaut(astronautData);
        setError("");
      } catch {
        setError("Unable to connect to AstroHealth API.");
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!health || !astronaut) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        {error || "Loading AstroHealth..."}
      </div>
    );
  }

  const metrics = [
    {
      label: "Heart Rate",
      value: health.heart_rate,
      unit: "BPM",
      icon: HeartPulse,
      color: "text-rose-400",
    },
    {
      label: "Oxygen Level",
      value: health.oxygen_level,
      unit: "%",
      icon: Activity,
      color: "text-cyan-400",
    },
    {
      label: "Sleep Duration",
      value: health.sleep_hours,
      unit: "hours",
      icon: Moon,
      color: "text-violet-400",
    },
    {
      label: "Radiation",
      value: health.radiation,
      unit: "simulated",
      icon: Radiation,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">
            AstroHealth
          </h1>
          <p className="text-slate-400">
            Astronaut Health Monitoring System
          </p>
        </div>
        <span className="text-emerald-400 text-sm">
          ● API Connected
        </span>
      </header>

      <section className="mb-8 rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <h2 className="text-xl font-semibold">
          {astronaut.name}
        </h2>
        <p className="text-slate-400">
          Mission: {astronaut.mission}
        </p>
        <p className="text-sm text-cyan-400 mt-2">
          Data source: Simulated
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <Icon className={`${metric.color} mb-4`} size={28} />
              <p className="text-slate-400">{metric.label}</p>
              <p className="text-3xl font-bold mt-2">
                {metric.value}
                <span className="text-sm text-slate-400 ml-2">
                  {metric.unit}
                </span>
              </p>
            </div>
          );
        })}
      </section>

      <footer className="mt-12 text-center text-slate-500 text-sm">
        NASA Space Apps Casablanca 2026 — Team EAGLES
      </footer>
    </div>
  );
}

export default App;
