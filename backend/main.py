
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

app = FastAPI(
    title="AstroHealth API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "project": "AstroHealth",
        "team": "EAGLES",
        "status": "running"
    }

@app.get("/api/astronaut")
def astronaut():
    return {
        "id": 1,
        "name": "Alex Morgan",
        "mission": "Mars Exploration",
        "status": "Active"
    }

@app.get("/api/health")
def health():
    return {
        "astronaut_id": 1,
        "heart_rate": 75,
        "oxygen_level": 98,
        "radiation": 0.12,
        "sleep_hours": 7.5,
        "stress_level": 25,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data_type": "simulated"
    }
