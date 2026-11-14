# Technical architecture

The React/Vite frontend calls FastAPI routers through Axios. A seeded in-memory `MissionSimulator` is the authoritative state source. Shared event, alert, analytics, command, report, and demo services consume that state.

The Guided Demo takes a snapshot of simulator RNG/state, events, and alerts before applying the fixed `Mars Crew Health Demonstration` preset. Exiting restores the snapshot. Production deployment should use one worker for a single demonstration or add session-scoped persistence before serving multiple visitors.
