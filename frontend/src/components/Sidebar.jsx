import { Activity, BrainCircuit, HeartPulse, Radio, Rocket, ShieldAlert, ShieldCheck, Telescope, Siren, PlayCircle, BookOpen, Info } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Mission overview", icon: Activity, end: true },
  { to: "/astronaut-health", label: "Astronaut health", icon: HeartPulse },
  { to: "/live-monitoring", label: "Live monitoring", icon: Radio },
  { to: "/risk-alerts", label: "Risk alerts", icon: ShieldCheck },
  { to: "/mission-simulator", label: "Mars simulator", icon: Rocket },
  { to: "/digital-twin", label: "Astronaut digital twin", icon: ShieldAlert },
  { to: "/health-analytics", label: "AI health analytics", icon: BrainCircuit },
  { to: "/mission-intelligence", label: "Mission intelligence", icon: Telescope },
  { to: "/mission-command", label: "Mission command center", icon: Siren },
  { to: "/guided-demo", label: "Guided demo", icon: PlayCircle },
  { to: "/scientific-evidence", label: "Scientific evidence", icon: BookOpen },
  { to: "/about", label: "About AstroHealth", icon: Info },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">AH</div>
        <div><strong>ASTRO<span>HEALTH</span></strong><small>MISSION CONTROL</small></div>
      </div>
      <nav>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <Icon size={17} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer"><p>TEAM EAGLES</p><span>NASA Space Apps · 2026</span></div>
    </aside>
  );
}

export default Sidebar;
