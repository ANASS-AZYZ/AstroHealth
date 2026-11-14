# Third-Party Assets

## AstroHealth Digital Twin

- **Model name:** Astronaut by Jungle Jim
- **Creator:** Jungle Jim
- **Original URL:** [https://skfb.ly/pPBUM](https://skfb.ly/pPBUM)
- **License:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](http://creativecommons.org/licenses/by/4.0/)
- **Local asset:** `frontend/public/models/astronaut.glb`
- **Modifications:** No modifications were made to the original GLB binary. AstroHealth clones and scales the loaded scene at runtime and adds interface-only health markers, lights, and camera controls.

The attribution is also displayed on the About AstroHealth page. Any future binary edits, derivatives, or replacement assets must be recorded here before release.

## NASA OSDR dataset

- **Dataset:** NASA Open Science Data Repository accession OSD-379 / GLDS-379
- **Study:** Transcriptional profiling of livers from mice flown on Rodent Research Reference Mission-1
- **Study URL:** [NASA OSDR study page](https://osdr.nasa.gov/bio/repo/data/studies/OSD-379)
- **Metadata source:** [OSD-379 version 3 metadata ZIP](https://nasa-osdr.s3.us-west-2.amazonaws.com/OSD-379/version-3/metadata/GLDS-379_metadata_GLDS-379-ISA.zip)
- **Public data listing:** [NASA OSDR S3 listing](https://nasa-osdr.s3.us-west-2.amazonaws.com/?list-type=2&prefix=OSD-379/version-3/&max-keys=20)
- **Usage terms:** The [NASA OSDR Open Data Registry entry](https://registry.opendata.aws/nasa-osdr/) states that the data has no restrictions on use.
- **AstroHealth usage:** Verified study metadata is displayed; no RNA-seq numerical values are imported or transformed into simulated astronaut telemetry.

The study accession and NASA OSDR citation must remain with public releases. The OSDR registry entry should be rechecked before submission for any updated terms or access requirements.

The application also displays verified metadata for [OSD-202](https://osdr.nasa.gov/bio/repo/data/studies/OSD-202), using the [version 10 metadata archive](https://nasa-osdr.s3.us-west-2.amazonaws.com/OSD-202/version-10/metadata/OSD-202_metadata_OSD-202-ISA.zip). No OSD-202 numerical measurements are imported.

## Local visual assets

- `frontend/public/images/astrohealth-logo.png`
- `frontend/public/favicon.png`
- `frontend/src/assets/hero.png`

These local images were visually checked for embedded creator marks or AI-generation watermarks; none were visible. The repository does not currently record their original creator, source URL, license, or generation history. Confirm and document that provenance before public submission; visual inspection alone does not establish licensing or prove that an image is human- or AI-created.
