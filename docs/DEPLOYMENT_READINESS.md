# AstroHealth Deployment Readiness

**Review date:** 2026-11-14
**Decision:** Ready for approval of a controlled deployment; not publicly deployed.

## Hosting architecture

- **Frontend:** Cloudflare Pages serving the Vite build.
- **Backend:** one Render Web Service instance using `backend/Dockerfile`.
- **Process model:** exactly one Uvicorn worker (`--workers 1`) and `numInstances: 1`.
- **Persistence:** process-local in-memory sessions; Redis and a database are intentionally not used.

This architecture is suitable only for a controlled demonstration. A restart, redeploy, idle spin-down, or instance replacement loses active sessions and mission history.

## Single-worker confirmation

- `backend/Dockerfile` explicitly starts Uvicorn with `--workers 1`.
- `render.yaml` explicitly sets `numInstances: 1`.
- No autoscaling or second backend instance is configured in the repository.
- Session IDs are unpredictable HttpOnly cookies.
- Session TTL, maximum capacity, and least-recently-used eviction are configured.
- Rate limiting is process-local and therefore is not coordinated across workers or instances.

Do not increase workers or instances until shared session persistence and distributed rate limiting are approved and implemented.

## Required environment variables

### Render

```text
APP_ENV=production
ALLOWED_ORIGINS=https://<exact-cloudflare-pages-origin>
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

`ALLOWED_ORIGINS` must contain the exact HTTPS frontend origin, without a wildcard or trailing slash.

### Cloudflare Pages

```text
VITE_API_BASE_URL=https://<exact-render-service-origin>
```

No secrets belong in Vite environment variables because frontend variables are public.

## Security findings

- Production startup fails fast for wildcard origins, non-HTTPS origins, insecure cookies, or invalid SameSite values.
- Credentialed CORS is enabled only for configured origins.
- State-changing browser requests with an unapproved non-empty `Origin` are rejected with HTTP 403.
- State-changing endpoints have process-local rate limits; provider-level rate limiting remains required for public traffic.
- The backend does not trust arbitrary `X-Forwarded-For` headers.
- Cookie-authenticated mutations use Origin validation as a controlled-demo CSRF defense. A broader authenticated product should add a synchronizer token or equivalent CSRF mechanism.
- No committed secrets were identified in the deployment configuration.

## Local validation results

| Check | Result |
|---|---|
| Backend unittest suite | PASS |
| Session isolation, TTL, capacity, and eviction tests | PASS |
| Telemetry consistency tests | PASS |
| Rate-limit and Origin protection tests | PASS |
| Production configuration fail-fast tests | PASS |
| Backend compileall | PASS |
| Frontend lint | PASS |
| Frontend production build | PASS |
| Local API health/CORS/cookie smoke | PASS |
| GLB inclusion in production build | PASS |
| Production HTTPS smoke test | NOT RUN — no deployment |

## Known limitations

1. Session state is process-local and disappears on restart or spin-down.
2. The deployment supports one backend instance and one Uvicorn worker only.
3. Rate limiting is not distributed.
4. The frontend build still reports a large Digital Twin chunk warning.
5. Public HTTPS behavior, cookie attributes, CORS, and direct-route behavior must be verified after deployment.

## Exact deployment instructions

1. Obtain user approval for deployment; do not deploy before approval.
2. Create one Render Web Service from the repository using `render.yaml`.
3. Configure the exact Cloudflare Pages HTTPS origin in `ALLOWED_ORIGINS`.
4. Confirm `APP_ENV=production`, `SESSION_COOKIE_SECURE=true`, and `SESSION_COOKIE_SAMESITE=none`.
5. Keep Render instance count at one and do not override the Docker command with additional workers.
6. Create the Cloudflare Pages project with root `frontend`, build command `npm ci && npm run build`, and output `dist`.
7. Set `VITE_API_BASE_URL` to the Render HTTPS origin and rebuild Pages.
8. Verify `/api/healthcheck`, CORS, Secure/SameSite cookie attributes, and two independent browser sessions.
9. Verify direct navigation to `/guided-demo`, `/digital-twin`, and `/mission-command`.
10. Record the production HTTPS smoke results in the release checklist.

## Remaining blockers before public launch

- User approval is required.
- A real HTTPS deployment smoke test is not yet possible without deployment.
- The single-process limitation must remain explicitly accepted for the demonstration.
- Provider-level rate limiting and final provider limits/costs must be confirmed before launch.
