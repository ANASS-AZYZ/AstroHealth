# AstroHealth deployment guide

## Selected architecture

Use **Cloudflare Pages** for the Vite frontend and exactly one **Render Web Service instance** running exactly one Uvicorn worker for the FastAPI backend. This keeps the frontend static, uses the existing backend Dockerfile, and avoids adding a database or Redis to the educational prototype.

This is a single-process demonstration deployment. Session state is isolated per browser using an unpredictable HttpOnly cookie and an in-memory TTL store. A restart, redeploy, idle spin-down, or second backend instance removes those sessions. Do not enable additional workers or instances until shared persistence is introduced.

## Verified provider notes

- Render documents that Free web services spin down after 15 minutes without inbound traffic and receive 750 included instance hours per workspace per month. Render also states that free instances are for testing and hobby projects, not production applications. See [Render free services](https://render.com/docs/free).
- Cloudflare Pages documents a Free-plan limit of 500 builds per month, 20-minute build timeout, and 25 MiB maximum per site asset. See [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/).
- Prices, account eligibility, quotas outside these documented limits, and future plan changes are **not guaranteed**. Confirm them in the provider dashboards before launch.

## Prerequisites

1. A GitHub repository with the AstroHealth source.
2. A Render account for the backend.
3. A Cloudflare account with Pages enabled for the frontend.
4. Confirmed redistribution permission for `frontend/public/models/astronaut.glb`.
5. A production HTTPS URL for each service.

## Environment variables

### Render backend

```text
ALLOWED_ORIGINS=https://<cloudflare-pages-domain>
APP_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=none
SESSION_TTL_SECONDS=3600
SESSION_MAX_ACTIVE=1000
SESSION_EVICTION_ENABLED=true
RATE_LIMIT_SESSION_PER_MINUTE=30
RATE_LIMIT_MUTATION_PER_MINUTE=120
RATE_LIMIT_REPORT_PER_MINUTE=10
RATE_LIMIT_COMPARISON_PER_MINUTE=20
```

Set `ALLOWED_ORIGINS` to the exact frontend origin, without a trailing slash or wildcard.
State-changing browser requests must include an allowed `Origin`; the backend rejects a non-empty origin that is not in `ALLOWED_ORIGINS`. This is a lightweight CSRF defense for the controlled demo, not a replacement for a full CSRF token strategy if the application becomes a broader authenticated service.

### Cloudflare Pages

```text
VITE_API_BASE_URL=https://<render-service-domain>
```

Build command: `npm ci && npm run build`
Output directory: `frontend/dist`
Root directory: `frontend`

## Local verification

```powershell
cd backend
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1

cd ..\frontend
npm ci
npm run lint
npm run build
```

Health checks:

```text
GET /api/healthcheck
GET /healthz
```

## Deployment steps

1. Confirm the documented GLB attribution and source/model correspondence before publishing.
2. Create the Render Web Service from the repository. The committed `render.yaml` uses `backend/Dockerfile`, sets `numInstances: 1`, and the Docker command sets `--workers 1`.
3. Configure the backend environment variables above.
4. Deploy the backend and verify `/api/healthcheck` returns `{"status":"ok","service":"astrohealth-api"}`.
5. Create a Cloudflare Pages project from the same repository.
6. Configure the frontend root, build command, output directory, and `VITE_API_BASE_URL`.
7. Copy the final Cloudflare Pages HTTPS origin into Render's `ALLOWED_ORIGINS`, then redeploy the backend.
8. Verify direct navigation to `/guided-demo`, `/digital-twin`, and `/mission-command`.
9. Verify two separate browser profiles receive independent mission sessions.

## Troubleshooting

- **CORS error:** check exact origin spelling and `allow_credentials` requirements; do not use `*`.
- **401/expired behavior:** refresh the page to receive a new session cookie after the configured TTL.
- **Blank route on refresh:** confirm the frontend `_redirects` file is present in the Pages output.
- **Slow first API request:** a Render Free service may be waking from idle.
- **Lost mission state:** in-memory session state is intentionally lost after restart or spin-down.
- **Missing model:** verify `frontend/public/models/astronaut.glb` is included in the frontend build.
- **429 responses:** the API uses conservative process-local per-client limits. Wait for the retry window; add provider-level limits before a broader public launch.
- **503 session capacity:** the oldest inactive session is evicted when the configured in-memory capacity is reached. Use one backend process only.

## Rollback

Use the provider's previous successful deployment or Render's documented rollback action. Do not roll back by deleting environment variables. After rollback, re-check the health endpoint, CORS origin, frontend API URL, and GLB availability.

## Security and limitations

The application is an educational simulation. All health values, alerts, analytics, and response effects are illustrative and are not medical advice, NASA operational guidance, or NASA endorsement. Do not expose secrets through frontend variables; Vite variables are public.

For multi-worker or multi-instance production, replace the in-memory session manager with shared persistent storage and add explicit session cleanup, rate limiting, and operational monitoring.

The application rate limiter is process-local and does not provide coordinated protection across workers or instances. It deliberately does not trust arbitrary forwarding headers; use a trusted provider or gateway limiter for public traffic.
