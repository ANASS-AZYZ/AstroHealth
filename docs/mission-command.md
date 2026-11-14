# Mission Command Center

The Mission Command Center is an educational emergency-response interface at `/mission-command`.
It reads the authoritative in-memory `mission_simulator`, existing alert rules, and shared mission event store.

The command API is available under `/api/command`:

- `GET /state`, `/scenarios`, `/actions`, `/events`, and `/messages`
- `POST /activate`, `/respond`, `/messages`, and `/reset`
- `GET /after-action.json` and `/after-action.pdf`

Command response effects advance the simulated mission clock by one hour and append telemetry to the same mission history used by the simulator, digital twin, analytics, alerts, and mission intelligence pages. State is intentionally in-memory for this prototype and is lost when the backend restarts.

All scenarios and consequences are illustrative. They are not medical advice, spacecraft procedures, or validated predictions.
