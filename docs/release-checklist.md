# AstroHealth release checklist

## Build and tests

- [ ] Frontend `npm ci`, lint, and production build pass.
- [ ] Backend dependency installation, syntax compilation, and unit tests pass.
- [ ] GitHub Actions workflow passes for the target commit.
- [ ] Two browser profiles demonstrate independent mission sessions.

## Configuration and security

- [ ] `VITE_API_BASE_URL` points to the deployed HTTPS backend.
- [ ] `ALLOWED_ORIGINS` contains only the deployed HTTPS frontend origin.
- [ ] `SESSION_COOKIE_SECURE=true` and `SESSION_COOKIE_SAMESITE=none` are set for cross-site HTTPS hosting.
- [ ] `APP_ENV=production` passes fail-fast CORS and cookie validation.
- [ ] Session capacity and process-local rate-limit values are configured.
- [ ] Provider-level rate limiting is configured for public traffic.
- [ ] Render runs exactly one instance and the backend starts with exactly one Uvicorn worker.
- [ ] Process-local session loss on restart/spin-down is accepted for the controlled demo.
- [x] `docs/ASSET_LICENSE_REQUIRED.md` records the identified provenance and CC BY 4.0 license; remaining verification items are reviewed before launch.
- [ ] No secrets are committed; frontend variables are treated as public.
- [ ] API health check returns 200 without private data.
- [ ] Network failure and expired-session messages are understandable.

## Assets and user safety

- [x] GLB redistribution license/provenance is documented in `docs/THIRD_PARTY_ASSETS.md`.
- [ ] Original source/model correspondence and any platform download terms are retained as release evidence.
- [ ] GLB loads from the production asset URL with markers and controls.
- [ ] Scientific disclaimer is visible on the homepage and relevant pages.
- [ ] No NASA endorsement, medical diagnosis, or real operational instructions are implied.

## Deployment approval

- [ ] HTTPS frontend and backend URLs are recorded.
- [ ] Production HTTPS smoke test verifies health, CORS, Secure/SameSite cookies, direct routes, and independent sessions.
- [ ] Provider limits and costs are re-checked immediately before launch.
- [ ] Rollback target is known.
- [ ] User explicitly approves public deployment.
- [ ] Public deployment is performed only after the approval above.
