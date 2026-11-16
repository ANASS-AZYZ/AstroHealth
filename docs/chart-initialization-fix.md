# Chart initialization fix

## Findings and changes

- `MissionSimulator.jsx` owned the only automatic simulation clock. Opening the dashboard, twin, or analytics directly left the initially running session with no historical observations. `useMissionClock.js`, mounted once in `App.jsx` after session bootstrap and outside Suspense, now owns the existing one-second advance cycle. It reads authoritative status/speed, respects pause/reset, skips overlapping requests, and stops on unmount. Simulator polls state/history instead of owning a second clock. Backend simulation logic and API contracts are unchanged.
- `HealthCharts.jsx` suppressed every point marker. A single measurement cannot form a line, so initial observations were invisible. Single-observation markers now render; existing multi-point colors and styles remain. Telemetry and simulator show the real current measurement when historical observations are empty, without inserting synthetic history. Live chart animations are disabled so geometry appears with the data rather than waiting for an animation (the old animation also exceeded the simulator update interval).
- `HealthAnalytics.jsx` read `prediction.metric` while constructing observed history. Missing predictions could crash rendering even with valid observations. Observations now use the chart definition's metric independently of forecast readiness. `AnalyticsTrendChart.jsx` renders isolated observations and does not animate data arrival. Comparison series in `MissionIntelligence.jsx` also render immediately.
- `useTelemetry.js` previously raced its initial history request against the initial live request. One guarded loader now initializes current data and history together, rejects updates after effect cleanup, and avoids overlapping polls. `AstronautHealth.jsx` now uses that polling hook rather than a one-time snapshot, and gains formatted time labels.
- `App.css` lets flex content and chart grid items shrink to their available width. Chart heights (190/230px), existing ResponsiveContainer observers, mobile breakpoints, themes, colors, and card layouts are preserved.

## Visualization audit

- Dashboard, Live Monitoring, Astronaut Health, Mission Simulator: shared HealthCharts (five line/area charts).
- Health Analytics: five observed/forecast/anomaly charts.
- Mission Intelligence: comparison line chart; readiness is ordinary DOM.
- Digital Twin: React Three Fiber Canvas with explicit 430px desktop / 360px mobile stage, GLTF Suspense and Bounds observe. Direct and returning-route model loading are regression tested; no model or camera workaround was needed.
- Simulator phase timeline and command/demo indicators are DOM visualizations, not hidden canvas charts.
- Lazy routes mount their contents through React Suspense. No navigation-triggered resize, forced reload, or arbitrary delay was added.

## Verification

Run from `frontend`:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:charts` (run build first)

The chart browser suite serves the production bundle locally and intercepts API transport with the real Pages handler backed by isolated in-memory SQLite sessions. It covers fresh dashboard baseline markers, history generation without simulator navigation, direct lazy-route initialization, asynchronous observations, missing predictions, sidebar/back navigation, responsive dimensions, Digital Twin model loading and comparison data arrival. This does not contact or modify a deployed environment.

Build retains the existing warning about the large Digital Twin dependency chunk. No commit, push, or deployment is performed.

Verified results: lint passed; 9 existing tests passed; 8 chart browser regressions passed (19.0s); production build passed with the existing large-chunk warning; git diff --check passed. The browser run used an explicitly started local preview server because automatic preview-server teardown hung in this Windows environment. The preview server was stopped after verification.
