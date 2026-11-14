import { useEffect, useState } from "react";
import { Activity, HeartPulse, Moon, Radio, UserRound } from "lucide-react";
import { getAstronaut, getDigitalTwin, getHealthHistory } from "../services/api";
import { HealthCharts } from "../components/HealthCharts";
import PageFrame from "./PageFrame";

function AstronautHealth() {
  const [profile, setProfile] = useState(null);
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAstronaut(), getDigitalTwin(), getHealthHistory()])
      .then(([astronaut, twin, oldHistory]) => {
        const current = twin.mission.health;
        setProfile(astronaut);
        setHealth({
          heart_rate: current.heart_rate,
          oxygen_level: current.oxygen_saturation,
          sleep_hours: current.sleep_hours,
          stress_level: current.stress_index,
          fatigue_index: current.fatigue_index,
          radiation: current.radiation_dose_rate,
          timestamp: current.timestamp,
        });
        setHistory(Array.isArray(oldHistory) ? oldHistory : []);
      })
      .catch(() => setError("Unable to load astronaut health data."));
  }, []);

  const metrics = [
    { label: "Heart rate", value: health?.heart_rate, unit: "BPM", icon: HeartPulse, color: "rose" },
    { label: "Oxygen saturation", value: health?.oxygen_level, unit: "%", icon: Activity, color: "cyan" },
    { label: "Sleep duration", value: health?.sleep_hours, unit: "hours", icon: Moon, color: "violet" },
    { label: "Stress index", value: health?.stress_level, unit: "index", icon: Activity, color: "cyan" },
    { label: "Fatigue index", value: health?.fatigue_index, unit: "index", icon: Activity, color: "violet" },
    { label: "Radiation exposure", value: health?.radiation, unit: "mSv/day", icon: Radio, color: "amber" },
  ];
  const chartData = history.map((item) => ({ ...item, oxygen_level: item.oxygen_level, stress_level: item.stress_level }));

  return (
    <PageFrame title="Astronaut health" section="ASTRONAUT HEALTH" error={error}>
      <section className="profile-card">
        <div className="profile-avatar"><UserRound size={28} /></div>
        <div><p className="eyebrow">FICTIONAL CREW PROFILE</p><h2>{profile?.name || "Alex Morgan"}</h2><p className="muted">{profile?.mission || "Mars Exploration"} · Flight specialist</p></div>
        <span className="mission-status"><span className="status-pulse" /> SIMULATED STATUS: ACTIVE</span>
      </section>
      <div className="section-heading"><div><p className="eyebrow">CURRENT READINGS</p><h2>Health overview</h2></div><p className="updated">All values are simulated</p></div>
      <section className="metrics-grid health-metrics">{metrics.map(({ icon: Icon, ...metric }) => <article className="metric-card" key={metric.label}><div className={`metric-icon ${metric.color}`}><Icon size={20} /></div><p className="eyebrow">{metric.label}</p><div className="metric-value">{metric.value ?? "--"} <span>{metric.unit}</span></div><p className="metric-caption">Demonstration reading</p></article>)}</section>
      <div className="section-heading"><div><p className="eyebrow">HISTORICAL TELEMETRY</p><h2>Recent trends</h2></div></div>
      <HealthCharts data={chartData} />
      <footer className="disclaimer">These readings are simulated, experimental, and not clinical measurements or medical advice.</footer>
    </PageFrame>
  );
}

export default AstronautHealth;
