from fastapi import APIRouter

from models.nasa import NASAEvidenceResponse
from services.nasa_evidence_service import get_nasa_evidence


router = APIRouter(prefix="/api/nasa", tags=["NASA evidence"])


@router.get("/evidence", response_model=NASAEvidenceResponse)
def nasa_evidence():
    return get_nasa_evidence()
