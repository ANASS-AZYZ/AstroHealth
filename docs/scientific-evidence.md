# Scientific Evidence

AstroHealth is motivated by established NASA human-research topics, but its generated values and rules are not NASA data or NASA models.

## Verified sources

- [Human Research Roadmap](https://humanresearchroadmap.nasa.gov/) — NASA Human Research Program, current web resource. Describes crew health and performance risks beyond low Earth orbit, including radiation, altered gravity, hostile environments, human factors, and behavioral health.
- [Behavioral Health](https://www.nasa.gov/directorates/esdmd/hhp/behavioral-health/) — NASA Human Health and Performance, 2023. Discusses confinement, variable workloads, separation, performance, teamwork, and communication delay.
- [Space Radiation Element](https://www.nasa.gov/hrp/radiation/) — NASA Human Research Program, current web resource. Describes research into health outcomes associated with space radiation and strategies to protect crew health.

These sources support the problem framing only. The application's workload, fatigue, stress, sleep, radiation-rate, forecast, alert, readiness, and response effects are simplified educational assumptions.

## Integrated NASA OSDR study

AstroHealth now displays verified metadata from NASA Open Science Data Repository accession [OSD-379](https://osdr.nasa.gov/bio/repo/data/studies/OSD-379), study `RRRM-1 / GLDS-379`: **Transcriptional profiling of livers from mice flown on Rodent Research Reference Mission-1 (RRRM-1)**.

- Metadata source: [OSD-379 version 3 metadata ZIP](https://nasa-osdr.s3.us-west-2.amazonaws.com/OSD-379/version-3/metadata/GLDS-379_metadata_GLDS-379-ISA.zip)
- Public files: [NASA OSDR S3 listing](https://nasa-osdr.s3.us-west-2.amazonaws.com/?list-type=2&prefix=OSD-379/version-3/&max-keys=20)
- Biological context: female BALB/cAnNTac mice and liver tissue.
- Mission context: Rodent Research-8 on the International Space Station, including ISS-terminal, live-animal-return, and matched control groups.
- Available measurements: RNA-seq transcription profiling on an Illumina NovaSeq platform, with raw and processed data products listed in the metadata.

The application imports study metadata only. It does not import RNA-seq numerical values, convert gene-expression measurements into astronaut telemetry, or use this study to calibrate thresholds, forecasts, readiness scores, or medical conclusions. NASA research observations and AstroHealth's seeded simulated telemetry remain separate.

The NASA Open Data Registry entry for [NASA Space Biology OSDR](https://registry.opendata.aws/nasa-osdr/) states that the data has no restrictions on use. AstroHealth should still cite NASA OSDR and the study accession in public releases.

AstroHealth also displays verified metadata from [NASA OSDR OSD-202](https://osdr.nasa.gov/bio/repo/data/studies/OSD-202), titled **Low dose (0.04 Gy) irradiation (LDR) and hindlimb unloading (HLU) microgravity in mice: brain transcriptomic and epigenomic data**.

- Metadata source: [OSD-202 version 10 metadata ZIP](https://nasa-osdr.s3.us-west-2.amazonaws.com/OSD-202/version-10/metadata/OSD-202_metadata_OSD-202-ISA.zip)
- Public files: [OSD-202 NASA OSDR S3 listing](https://nasa-osdr.s3.us-west-2.amazonaws.com/?list-type=2&prefix=OSD-202/version-10/&max-keys=20)
- Scientific context: a NASA-funded ground-based animal model using mature female C57BL/6 mice, hindlimb unloading, and 0.04 Gy whole-body gamma irradiation.
- Available measurements: brain transcriptomic RNA-seq, Illumina DNA microarray transcription profiling, and reduced-representation bisulfite sequencing DNA methylation profiling.

OSD-202 is animal research, not direct astronaut health telemetry. Its modeled unloading and radiation conditions provide relevant research context but do not validate human health predictions. AstroHealth displays metadata only and imports no OSD-202 numerical measurements.
