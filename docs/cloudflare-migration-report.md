# AstroHealth Cloudflare migration

Prepared locally on 2026-11-16. **Nothing has been deployed or pushed.** The public URL remains `https://astrohealth-eagles.pages.dev`. The live site continues to use its previously deployed code until the owner deploys this change. No Google deployment or billing settings were changed.

## Implementation

All 51 `/api/*` FastAPI routes are implemented in JavaScript. `frontend/functions/api/[[path]].js` now invokes the local Pages backend; it contains no upstream proxy. Reusable code is in `frontend/functions/_lib/`. `backend/` is unchanged and remains the reference/fallback.

Completed: mission controls, all six mission scenarios and seven phases, seeded telemetry and history, legacy health field aliases, deduplicated alerts and acknowledgement, events, readiness, linear predictions, rolling anomalies, insights, digital twin responses, isolated scenario comparisons, six command scenarios and their actions, mission-clock message delivery, command reset/after-action exports, eight-step demo with snapshot restoration, NASA OSDR metadata, telemetry CSV/JSON, event JSON, and both PDF reports.

The frontend retains its existing routes, layouts, CSS, themes, branding, and GLB. Only three pages' obsolete technology/storage/error messages were updated. Production Axios requests continue to use same-origin `/api/*`. NASA evidence remains curated metadata with the original retrieval date, with no imported numerical measurements. Generated health values remain explicitly simulated; forecasts, readiness and actions remain educational and unvalidated.

## Inventory and dependencies

The machine-readable [route inventory](cloudflare-route-inventory.json) lists every FastAPI path, method, and operation identifier. The [plan](cloudflare-migration-plan.md) records the implementation sequence and storage assessment. Inspected sources include every router, service, Pydantic model, backend test, backend configuration/container file, frontend API wrapper, hook, and consuming page. No backend database, live NASA fetch, credential, model weight, or external Python service is required by these contracts. The CSV data directory is not read by the authoritative simulator.

| API group | State and outputs | Frontend consumers |
| --- | --- | --- |
| `GET /api/session`, `/healthcheck`, `/astronaut` | Opaque session bootstrap; health status; fictional profile | `App`, `useTelemetry`, `AstronautHealth` |
| `GET /api/health`, `/health/live`, `/health/history` | Same simulator; legacy oxygen/stress/radiation names | Overview, Live Monitoring, Astronaut Health, charts |
| `GET /api/mission/{state,history,scenarios,phases}`; `POST /api/mission/{start,pause,resume,reset,scenario,phase,speed,advance}` | Status, phase, seed/RNG, seven measurements, history, alerts | Mission Simulator, Digital Twin, Intelligence |
| `GET /api/analytics/{summary,predictions,anomalies,insights}`, `/api/insights` | History-derived statistical outputs, data-quality labels, disclosures | Health Analytics |
| `GET /api/alerts`; `POST /api/alerts/{alert_id}/acknowledge` | Persistent rule IDs, first-trigger values, acknowledgements | Risk Alerts, Health Analytics, Digital Twin |
| `GET /api/digital-twin` | Mission state plus profile, explanations, alerts, predictions and insights | Digital Twin, Astronaut Health |
| `GET /api/mission/{events,readiness}`; `POST /api/mission/compare` | Reverse chronological events; disclosed weighted score; independent same-seed runs | Mission Intelligence |
| `GET /api/command/{state,scenarios,actions,events,messages}`; `POST /api/command/{activate,respond,reset,messages}` | Active scenario, initial measurements, consequences, actions, delayed messages | Mission Command |
| `GET /api/command/after-action.{json,pdf}` | Current authoritative after-action summary | Mission Command downloads |
| `GET /api/demo/{state,status}`; `POST /api/demo/{start,advance,reset,exit}` | Seed 7042 preset, step index, previous mission/RNG/history/events/alerts snapshot | Guided Demo |
| `GET /api/export/{telemetry.csv,telemetry.json,events.json}` | Current session data with metadata, attachment headers, CSV formula protection | Mission Intelligence |
| `GET /api/reports/mission-health` | Paginated PDF using current session measurements and analytics | Mission Intelligence, demo report step |
| `GET /api/nasa/evidence` | Original OSD-379 and OSD-202 curated metadata and provenance | Scientific Evidence |

The Python root `/`, `/healthz`, and automatic OpenAPI/Swagger interfaces were not public Pages API routes. The frontend root remains the React application; `/api/healthcheck` is the Pages health endpoint.

## Durable sessions and security

Required binding: **`ASTROHEALTH_DB`**, a D1 database initialized with `frontend/migrations/0001_sessions.sql`. No secrets are required by this backend. The checked-in zero database UUID in `frontend/wrangler.jsonc` is a local placeholder, not a provisioned production database. Replace it with the returned database ID before remote deployment. Database IDs are not credentials. Preview deployments should use a separate database.

Each session stores the simulator state, CPython-compatible MT19937 state, full telemetry history, alert history/acknowledgements, recorded alert IDs, events, command state, messages, demo step and demo snapshot. Each request hydrates fresh data. A conditional `UPDATE ... WHERE version = ?` commits all effects atomically, including reads that create alerts or deliver messages. Concurrent conflicts retry against fresh data up to eight times; unresolved contention returns 409. D1 reads use a `first-primary` session. There is no process-global durable state and no ephemeral fallback. Missing or failed storage returns 503.

Cookies contain 256 bits of randomness: `astrohealth_session`, HttpOnly, Path `/`, Max-Age 3600, SameSite=Lax, and Secure on HTTPS. SameSite changes from the cross-host Python production setting to Lax because the API is now same-origin. Server idle expiration is one hour; the browser cookie's original one-hour lifetime remains compatible with the Python behavior. Expired or unknown supplied cookies receive 401 and `X-AstroHealth-Session-Expired: true`; the existing Axios interceptor renews and retries. Previously issued Python sessions cannot be imported from the unavailable process; existing browsers renew into new sessions after migration.

Mutations reject different Origin values and cross-site Fetch Metadata. Input schemas enforce scenario/phase/speed enums, tick/step bounds, string lengths and a 16 KiB JSON body limit. Validation errors retain the FastAPI-style 422 `detail` array; exact Pydantic wording/context is not byte-identical. Numerical integer fields accept whole numeric strings and booleans as the reference does. Some exotic Pydantic coercions are intentionally stricter. Unknown paths return 404; known paths with unsupported methods return 405.

Rate counters are persisted atomically in D1, per hashed `CF-Connecting-IP`, with separate session/mutation/report/comparison buckets. Limits are 60 requests per minute per bucket; they use fixed minute windows rather than Python's sliding window. Clients sharing an IP share limits. Without Cloudflare's trusted header, local requests share a `local` bucket. Raw IP addresses are not stored. This is practical demo protection, not comprehensive abuse prevention. Rejected requests can consume D1 writes. Rate-counter and expired-session cleanup is bounded and runs during session creation; there is no cron process. At most 1000 stored sessions are permitted; capacity returns 503 rather than evicting another active visitor.

Session JSON is limited to 1,000,000 UTF-8 bytes, below D1's row limit. A request that would exceed capacity returns 409 without changing committed state. Existing data can still be exported, then the mission reset. No silent history truncation occurs. A demo snapshot and response history count toward this limit. Long/high-speed runs can reach it. D1's database quota may be reached before the session count limit; storage failures remain explicit 503 responses. Expired records are logically inaccessible immediately, but physical cleanup waits for future session creation or owner maintenance.

## PDF reports

Both report endpoints produce actual PDF 1.4 attachments directly in Workers using standard Helvetica, escaped text, byte offsets and pagination. Health reports include units, current values, analytics quality, readiness, alerts, scenario assumptions and medical limitations. After-action reports include actions and before/after measurements. ReportLab typography is not reproduced, and unsupported non-ASCII glyphs are transliterated/replaced. No native binaries or external PDF service are used. Tests verify PDF signatures/trailers and successful browser downloads; independent PDF-parser and visual print-layout review remain optional prelaunch checks.

## Validation

- Original Python tests: **29 passed**; no Python application/test files modified.
- JavaScript tests: **9 passed**, covering all 51 route registrations, 40 sequential Python contract responses, 126 Python numerical reference cases (six scenarios × seven phases × three seeds), simulator controls/bounds, durable reopen, concurrent requests, isolation, expiry/renewal, secure cookies, origin rejection, validation, rate limiting, capacity rollback/recovery, exports, messages, demo restore and the actual frontend Axios API client/interceptor.
- Compiled Pages Function in **workerd with real D1**: passed the reference route sequence, concurrent advances, isolate restart continuity, and downloads.
- **Two real Chrome/Playwright workflows passed** against local `wrangler pages dev` plus D1: guided demo → acknowledgement → command response/message → analytics → comparison → PDF → NASA evidence → exit; simulator start/pause/reset/scenario → shared health/live-monitoring pages. Browser requests assert no `run.app` access.
- Frontend ESLint, Vite build, Wrangler Functions build, and local D1 migration pass. Vite retains its existing large Digital Twin chunk warning.
- New Miniflare tooling was aligned with Wrangler's current Miniflare version to remove high-severity duplicate dependency findings. Three moderate ESLint-chain advisories remain; a broad lint-tool upgrade was not part of the migration.

Local tests do not establish production CPU, latency, account eligibility or remaining account quotas. No remote D1 database, preview or production deployment was created. A preview deployment and inspection of CPU/quota metrics are still required before production cutover. The demo status model check assumes the existing `public/models/astronaut.glb` is packaged; it is present in this checkout and unchanged.

## Free-tier operation

This design uses eligible Workers Free + Pages Functions + D1 resources, without Google billing, paid APIs, KV, R2 or a separate Durable Object Worker. It does not guarantee unlimited free service. As checked on 2026-11-16, [D1 Free](https://developers.cloudflare.com/d1/platform/pricing/) includes 5 million rows read/day, 100,000 written/day and 5 GB aggregate storage; the [per-database limits](https://developers.cloudflare.com/d1/platform/limits/) also apply. [Workers Free](https://developers.cloudflare.com/workers/platform/limits/) permits 100,000 requests/day and 10 ms CPU/request. Pages Function traffic counts against Workers quotas.

The session expiry index adds write accounting. A normal session request reads and updates one row; mutations additionally update a rate-counter row, and conflicts add reads/writes. Frequent polling can consume quota before request limits: one continuously open simulator can generate tens of thousands of D1 writes over hours. Deploy on Workers Free, monitor row metrics and CPU, and limit demonstration usage. If quotas are exhausted, operations fail; they never fall back to unreliable local state or Cloud Run. Large histories and high contention require particular preview CPU checks. Account quota exhaustion can prevent health/session workflows until quotas reset. This is a bounded educational/demo deployment.

## Reproduce locally (PowerShell)

Use Node 24+ (tests use `node:sqlite`) and the existing Python environment with FastAPI, Pydantic, ReportLab and TestClient's HTTP dependency. On machines that block PowerShell npm wrappers, use `npm.cmd`/`npx.cmd` as below.

```powershell
cd D:\PROJECT2026-2027\AstroHealth\backend
python -m unittest discover -s tests -v

cd ..\frontend
npm.cmd ci
npm.cmd run lint
npm.cmd test
# Optional: regenerate golden references from the unchanged Python implementation.
npm.cmd run reference:fixtures
npm.cmd test
npm.cmd run build
npm.cmd run test:cloudflare
npm.cmd run cf:migrate:local
npm.cmd run cf:dev -- --port 8788
```

In another terminal, with Chrome installed:

```powershell
cd D:\PROJECT2026-2027\AstroHealth\frontend
npm.cmd run test:browser
```

`PLAYWRIGHT_CHANNEL` can select another installed browser, such as `msedge`. Chrome is the current test default. On Linux CI, install Chrome or configure the channel appropriately. Browser tests expect the built local Pages server on port 8788. CI automatically runs lint, contract tests, workerd tests and build; browser tests are separately invoked.

If the workspace sandbox prevents Wrangler writing its normal user configuration directory, use these local overrides before the Wrangler commands:

```powershell
$env:XDG_CONFIG_HOME = Join-Path (Get-Location) '.wrangler/config'
$env:WRANGLER_LOG_PATH = Join-Path (Get-Location) '.wrangler/logs'
$env:WRANGLER_SEND_METRICS = 'false'
```

These paths are ignored. Local Wrangler's optional `Request.cf` metadata lookup was network-blocked in the sandbox; it used its documented local placeholder and the tests still passed.

## Exact deployment steps — owner action, not executed

Avoid pushing to the existing Pages production branch until bindings and migrations are ready: Git integration can deploy automatically. Confirm in the Cloudflare dashboard that the existing project is `astrohealth-eagles`, its production branch (normally `main`), build root `frontend`, build command `npm run build`, and output `dist`. Preserve the project and its domains. Production Vite already uses relative `/api` URLs; no backend-origin environment variable is needed.

1. Authenticate and create separate production and preview databases:

```powershell
cd D:\PROJECT2026-2027\AstroHealth\frontend
npx.cmd wrangler login
npx.cmd wrangler d1 create astrohealth-sessions
npx.cmd wrangler d1 create astrohealth-sessions-preview
```

2. Replace `database_id` in `wrangler.jsonc` with the production ID. For isolated preview configuration add the following section, replacing its placeholder with the preview ID (keep the existing top-level production binding):

```json
"env": {
  "preview": {
    "d1_databases": [{
      "binding": "ASTROHEALTH_DB",
      "database_name": "astrohealth-sessions-preview",
      "database_id": "PREVIEW_DATABASE_ID",
      "migrations_dir": "migrations"
    }]
  }
}
```

Confirm current [Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) and [D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases) in the dashboard. The required binding name must be exactly `ASTROHEALTH_DB` in both deployment environments. Do not use the production DB for preview tests.

3. Apply both schemas and build/test:

```powershell
npx.cmd wrangler d1 migrations apply astrohealth-sessions --remote
npx.cmd wrangler d1 migrations apply astrohealth-sessions-preview --env preview --remote
npm.cmd run lint
npm.cmd test
npm.cmd run test:cloudflare
npm.cmd run build
```

4. Deploy only a preview branch first:

```powershell
npx.cmd wrangler pages deploy dist --project-name astrohealth-eagles --branch migration-cloudflare
```

Open the returned preview URL. Confirm its D1 binding points to the preview database, `/api/healthcheck` returns OK, `/api/session` sets Secure/HttpOnly cookies, and the Network panel shows only same-origin APIs. Run the demonstrated workflows, download both PDFs/CSV/JSON, confirm renewal after expiry and continuity across reloads, and inspect Workers CPU/errors and D1 row metrics, including long history at 50x. Review database quotas before proceeding.

5. Only after preview validation and owner authorization, deploy to the **existing project's confirmed production branch**:

```powershell
# Replace main if the dashboard identifies a different production branch.
npx.cmd wrangler pages deploy dist --project-name astrohealth-eagles --branch main
```

This updates the existing `https://astrohealth-eagles.pages.dev` deployment; it does not create a new frontend project. Keep Cloudflare API tokens in Wrangler login/session storage or secret CI settings, never in Git, scripts, `.env` or command output. No tokens are needed in application code. No `.env` files or credentials were added.

Rollback is a Pages deployment rollback to the prior version or a local revert before deployment. Do not remove the D1 data during rollback. The prior proxy still depends on the unavailable Google backend, so rolling back the frontend is not a promise of backend availability. The retained Python code can be used for local reference/fallback without changing Google billing or deleting its deployment.
