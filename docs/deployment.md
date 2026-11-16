# Deployment preparation

**Current migration:** see [Cloudflare migration report](cloudflare-migration-report.md) for the Pages Functions + D1 replacement, preserving the existing Pages URL. The instructions below describe the earlier Python hosting approach and are retained as reference.

The simplest deployment shape is a static Vite frontend on Vercel, Netlify, or Cloudflare Pages plus one FastAPI service on a compatible Python host such as Render, Railway, or Cloud Run. Provider pricing and free-tier limits change; verify current terms before choosing a provider.

## Backend

The repository includes [backend/Dockerfile](../backend/Dockerfile), [render.yaml](../render.yaml), `/healthz`, and `/api/healthcheck`. Set `ALLOWED_ORIGINS` to the exact HTTPS frontend origin, without a wildcard.

## Frontend

Build with `npm run build` and set `VITE_API_BASE_URL` to the deployed HTTPS FastAPI URL. The frontend must not use a localhost URL in a production environment.

## State model

The simulator, events, alerts, demo snapshots, exports, and legacy live telemetry are in-memory. Each browser receives an unpredictable, expiring session cookie and an independent state container. Run one backend worker for a single public demonstration; restarts erase history, and state is not shared across multiple workers or instances.

For the complete selected Cloudflare Pages + Render architecture and launch gate, see [deployment-guide.md](deployment-guide.md) and [release-checklist.md](release-checklist.md).

No public deployment has been performed from this repository.
