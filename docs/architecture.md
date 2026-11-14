# Architecture

AstroHealth uses a React/Vite frontend and FastAPI backend.

```text
React pages
  -> Axios API service
  -> FastAPI routers
  -> MissionSimulator (seeded in-memory authoritative state)
  -> alerts, events, analytics, reports, command, and demo services
```

The Guided Demo uses the same `MissionSimulator` class and takes a reversible snapshot of mission state, alerts, events, and the random generator state. Starting the demo is explicit; exiting restores the snapshot. The Digital Twin, Risk Alerts, Mission Intelligence, and Mission Command Center therefore read the same state while the demo is active.

The status panel checks backend route availability, the GLB model, telemetry history, analytics registration, and report registration. Runtime history is intentionally not persistent.
