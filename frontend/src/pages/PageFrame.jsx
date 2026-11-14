import { Wifi, WifiOff } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ThemeSelector from "../components/ThemeSelector";

function PageFrame({ children, title, section, error = "", className = "" }) {
  return (
    <main className={`app-shell ${className}`}>
      <Sidebar />
      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">MISSION CONTROL / {section}</p><h1>{title}</h1></div>
          <div className="topbar-actions"><ThemeSelector /><div className={`connection ${error ? "offline" : ""}`}>{error ? <WifiOff size={16} /> : <Wifi size={16} />}<span>{error ? "Disconnected" : "API connected"}</span></div></div>
        </header>
        {error && <div className="notice"><WifiOff size={17} />{error}</div>}
        {children}
      </section>
    </main>
  );
}

export default PageFrame;
