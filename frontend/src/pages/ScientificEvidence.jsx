import { ExternalLink, ShieldCheck } from "lucide-react";
import PageFrame from "./PageFrame";

const references = [
  { topic: "Long-duration mission monitoring", title: "Human Research Roadmap", author: "NASA Human Research Program", year: "current web resource", url: "https://humanresearchroadmap.nasa.gov/", relevance: "NASA describes crew health and performance risks beyond low Earth orbit, including radiation, altered gravity, hostile environments, human factors, and behavioral health." },
  { topic: "Behavioral health and isolation", title: "Behavioral Health", author: "NASA Human Health and Performance", year: "2023", url: "https://www.nasa.gov/directorates/esdmd/hhp/behavioral-health/", relevance: "NASA discusses confinement, variable workloads, separation, performance, teamwork, and communication delay as behavioral-health considerations." },
  { topic: "Space radiation", title: "Space Radiation Element", author: "NASA Human Research Program", year: "current web resource", url: "https://www.nasa.gov/hrp/radiation/", relevance: "NASA's Space Radiation Element studies health outcomes associated with radiation exposure and develops strategies to protect crew health beyond Earth's protective atmosphere." },
];

function ScientificEvidence() {
  return <PageFrame title="Scientific evidence" section="RESEARCH CONTEXT">
    <section className="info-hero"><p className="eyebrow">SCIENCE VS SIMULATION</p><h2>Why monitor crew health during long-duration missions?</h2><p>AstroHealth uses NASA research topics as motivation for an educational interface. The application does not reproduce NASA models or use astronaut data.</p></section>
    <section className="evidence-grid">{["Space radiation", "Isolation and confinement", "Altered gravity", "Sleep and circadian disruption", "Behavioral health", "Human performance", "Long-duration monitoring"].map((topic) => <article className="evidence-topic" key={topic}><ShieldCheck size={17} /><h3>{topic}</h3><p>Relevant research motivates continuous observation, transparent assumptions, and crew-centered decision support.</p></article>)}</section>
    <section className="reference-list"><div className="section-heading"><div><p className="eyebrow">VERIFIED REFERENCES</p><h2>Authoritative starting points</h2></div></div>{references.map((reference) => <article className="reference-card" key={reference.url}><div><p className="eyebrow">{reference.topic}</p><h3>{reference.title}</h3><p className="muted">{reference.author} · {reference.year}</p><p>{reference.relevance}</p></div><a href={reference.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Source</a></article>)}</section>
    <section className="transparency-grid"><article className="command-card"><h3>Scientifically supported concepts</h3><p>Spaceflight beyond low Earth orbit presents environmental, physiological, behavioral, and performance challenges that motivate research and monitoring.</p></article><article className="command-card"><h3>Illustrative simulation assumptions</h3><p>AstroHealth uses bounded seeded effects between workload, fatigue, stress, sleep, radiation-rate indicators, and alerts for demonstration.</p></article><article className="command-card"><h3>Experimental software features</h3><p>Forecasts, anomaly detection, readiness scores, and response effects are prototype analytics, not validated medical or operational models.</p></article></section>
  </PageFrame>;
}

export default ScientificEvidence;
