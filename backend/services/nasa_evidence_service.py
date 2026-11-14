from models.nasa import NASAEvidenceResponse, NASAStudyEvidence


OSDR_STUDY = NASAStudyEvidence(
    source_name="NASA Open Science Data Repository (OSDR)",
    accession="OSD-379",
    study_identifier="RRRM-1 / GLDS-379",
    title=(
        "Transcriptional profiling of livers from mice flown on "
        "Rodent Research Reference Mission-1 (RRRM-1)"
    ),
    study_url="https://osdr.nasa.gov/bio/repo/data/studies/OSD-379",
    metadata_url=(
        "https://nasa-osdr.s3.us-west-2.amazonaws.com/"
        "OSD-379/version-3/metadata/"
        "GLDS-379_metadata_GLDS-379-ISA.zip"
    ),
    data_listing_url=(
        "https://nasa-osdr.s3.us-west-2.amazonaws.com/"
        "?list-type=2&prefix=OSD-379/version-3/&max-keys=20"
    ),
    study_scope="Animal spaceflight research; not direct astronaut health telemetry.",
    biological_context=(
        "Female BALB/cAnNTac mice; the study profiles liver tissue using "
        "ribodepleted total RNA sequencing."
    ),
    mission_context=(
        "Rodent Research-8 on the International Space Station. The study "
        "includes ISS-terminal animals, live-animal-return animals, and "
        "matched ground, basal, and vivarium controls."
    ),
    relevance=(
        "Provides spaceflight-associated biological research context for "
        "understanding how mission conditions can affect animal tissues."
    ),
    sample_context=[
        "160 mice were included across young and old cohorts and control groups.",
        "The metadata reports 7-10 liver samples per group.",
        "Young mice were 10-12 weeks old; old mice were 32 weeks old.",
    ],
    available_measurements=[
        "Transcription profiling by RNA sequencing (RNA-seq).",
        "Illumina NovaSeq platform; paired-end 149 bp reads.",
        "Public raw sequence, processed count, normalized count, and differential-expression files are listed by the study metadata.",
    ],
    numerical_values_imported=False,
    availability_note=(
        "AstroHealth imports verified study metadata only. It does not "
        "download or transform RNA-seq measurements into astronaut telemetry."
    ),
    license_note=(
        "The NASA OSDR AWS Open Data Registry entry states that the data "
        "has no restrictions on use. Cite NASA OSDR and the study accession."
    ),
    retrieved_at="2026-11-14",
)

OSDR_STUDY_OSD_202 = NASAStudyEvidence(
    source_name="NASA Open Science Data Repository (OSDR)",
    accession="OSD-202",
    study_identifier="OSD-202",
    title=(
        "Low dose (0.04 Gy) irradiation (LDR) and hindlimb unloading (HLU) "
        "microgravity in mice: brain transcriptomic and epigenomic data"
    ),
    study_url="https://osdr.nasa.gov/bio/repo/data/studies/OSD-202",
    metadata_url=(
        "https://nasa-osdr.s3.us-west-2.amazonaws.com/"
        "OSD-202/version-10/metadata/OSD-202_metadata_OSD-202-ISA.zip"
    ),
    data_listing_url=(
        "https://nasa-osdr.s3.us-west-2.amazonaws.com/"
        "?list-type=2&prefix=OSD-202/version-10/&max-keys=20"
    ),
    study_scope="Animal ground research; not direct astronaut health telemetry.",
    biological_context=(
        "Mature, 6-month-old female C57BL/6 mice. Brain and eye-related "
        "tissues were collected after the modeled spaceflight conditions."
    ),
    mission_context=(
        "This is a ground-based model for spaceflight, not an ISS mission. "
        "Hindlimb unloading models unloading, fluid shift, and physiological "
        "stress; whole-body 57Co gamma irradiation models a low-dose radiation "
        "component."
    ),
    relevance=(
        "Its combined unloading and low-dose radiation design provides animal "
        "research context for studying biological responses relevant to "
        "spaceflight health, while not predicting human crew outcomes."
    ),
    sample_context=[
        "Mice were hindlimb-suspended and/or irradiated for 21 days.",
        "Tissues were collected 7 days and 1, 4, and 9 months after treatment.",
        "The study was released as a NASA-funded ground study; it is not astronaut telemetry.",
    ],
    available_measurements=[
        "Brain transcriptomic profiling by RNA sequencing.",
        "Transcription profiling by Illumina DNA microarray.",
        "DNA methylation profiling by reduced-representation bisulfite sequencing.",
    ],
    numerical_values_imported=False,
    availability_note=(
        "AstroHealth imports verified study metadata only. It does not "
        "download or transform OSD-202 measurements into astronaut telemetry."
    ),
    license_note=(
        "The NASA OSDR AWS Open Data Registry entry states that the data "
        "has no restrictions on use. Cite NASA OSDR and the study accession."
    ),
    retrieved_at="2026-11-14",
)


def get_nasa_evidence() -> NASAEvidenceResponse:
    return NASAEvidenceResponse(
        study=OSDR_STUDY,
        additional_studies=[OSDR_STUDY_OSD_202],
        distinction=(
            "NASA research metadata and measurement availability are shown "
            "separately from AstroHealth's seeded simulated astronaut telemetry. "
            "The OSDR study does not calibrate the simulator, alerts, forecasts, "
            "readiness score, or medical conclusions."
        ),
    )
