from pydantic import BaseModel, Field


class NASAStudyEvidence(BaseModel):
    source_name: str
    accession: str
    study_identifier: str
    title: str
    study_url: str
    metadata_url: str
    data_listing_url: str
    study_scope: str
    biological_context: str
    mission_context: str
    relevance: str
    sample_context: list[str]
    available_measurements: list[str]
    numerical_values_imported: bool
    availability_note: str
    license_note: str
    retrieved_at: str


class NASAEvidenceResponse(BaseModel):
    study: NASAStudyEvidence
    additional_studies: list[NASAStudyEvidence] = Field(default_factory=list)
    distinction: str
