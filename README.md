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

The Mission Command Center is available at `/mission-command`. It uses deterministic, in-memory simulated mission state and is not a medical or spacecraft operations system.

See [mission-command.md](docs/mission-command.md), [emergency-scenarios.md](docs/emergency-scenarios.md), and [response-model.md](docs/response-model.md) for assumptions and limitations.

## Demonstration experience

Open `/guided-demo` for the eight-step **Mars Crew Health Demonstration**. The demo uses seed `7042`, triggers a real configured alert through the existing simulation engine, and restores the previous mission state when the user exits.

Additional context is available in [demo-guide.md](docs/demo-guide.md), [scientific-evidence.md](docs/scientific-evidence.md), [architecture.md](docs/architecture.md), and [limitations.md](docs/limitations.md).

## Production preparation

Use [deployment-guide.md](docs/deployment-guide.md) for the selected Cloudflare Pages + Render architecture, environment variables, session isolation, health checks, and rollback steps. The release gate is recorded in [release-checklist.md](docs/release-checklist.md), and the final audit is in [final-test-report.md](docs/final-test-report.md).

The backend creates an independent, expiring in-memory session per browser. This prevents visitors from controlling one another during a single-process demonstration, but state is lost on restart and is not shared across workers or instances.

The [submission/](submission/) folder contains the draft project description, problem statement, solution overview, technical architecture, scientific sources, demo script, and submission checklist. Official 2026 event requirements and deadlines must be confirmed from the official event site before submission.
