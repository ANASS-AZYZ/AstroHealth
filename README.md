# AstroHealth

AstroHealth is Team EAGLES' NASA Space Apps Challenge 2026 educational mission-health prototype.

## Run locally

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

The Mission Command Center is available at `/mission-command`. It uses deterministic simulated mission state and is not a medical or spacecraft operations system. The Python reference runs in memory; the prepared Cloudflare backend persists sessions in D1.

See [mission-command.md](docs/mission-command.md), [emergency-scenarios.md](docs/emergency-scenarios.md), and [response-model.md](docs/response-model.md) for assumptions and limitations.

## Demonstration experience

Open `/guided-demo` for the eight-step **Mars Crew Health Demonstration**. The demo uses seed `7042`, triggers a real configured alert through the existing simulation engine, and restores the previous mission state when the user exits.

Additional context is available in [demo-guide.md](docs/demo-guide.md), [scientific-evidence.md](docs/scientific-evidence.md), [architecture.md](docs/architecture.md), and [limitations.md](docs/limitations.md).

## Production preparation

The prepared production migration is **Cloudflare Pages Functions + D1**, keeping `https://astrohealth-eagles.pages.dev`. Start with [the Cloudflare migration report](docs/cloudflare-migration-report.md) for local tests, bindings, limitations and exact preview/production commands. It has not been deployed. The Python backend and older deployment notes below remain historical reference/fallback documentation.

Earlier Python hosting notes in [deployment-guide.md](docs/deployment-guide.md), [release-checklist.md](docs/release-checklist.md), and [final-test-report.md](docs/final-test-report.md) are historical reference. The Cloudflare migration does not use Render or PythonAnywhere.

The reference Python backend creates an independent, expiring in-memory session per browser. Its state is lost on restart and is not shared across workers. The Cloudflare implementation preserves isolation and expiration using durable D1 sessions and conditional updates across requests and isolates.

The [submission/](submission/) folder contains the draft project description, problem statement, solution overview, technical architecture, scientific sources, demo script, and submission checklist. Official 2026 event requirements and deadlines must be confirmed from the official event site before submission.
