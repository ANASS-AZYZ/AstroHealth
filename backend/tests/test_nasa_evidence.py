import unittest

from fastapi.testclient import TestClient

from main import app
from services.nasa_evidence_service import get_nasa_evidence


class NASAEvidenceTests(unittest.TestCase):
    def test_evidence_contains_verified_osdr_metadata_without_measurements(self):
        evidence = get_nasa_evidence()

        self.assertEqual(evidence.study.accession, "OSD-379")
        self.assertEqual(evidence.study.study_identifier, "RRRM-1 / GLDS-379")
        self.assertIn("livers from mice", evidence.study.title)
        self.assertFalse(evidence.study.numerical_values_imported)
        self.assertTrue(evidence.study.metadata_url.startswith("https://nasa-osdr.s3."))
        self.assertEqual(evidence.additional_studies[0].accession, "OSD-202")
        self.assertIn("hindlimb unloading", evidence.additional_studies[0].title)
        self.assertIn("Animal ground research", evidence.additional_studies[0].study_scope)
        self.assertFalse(evidence.additional_studies[0].numerical_values_imported)

    def test_nasa_evidence_endpoint_returns_public_provenance(self):
        with TestClient(app) as client:
            response = client.get("/api/nasa/evidence")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["study"]["accession"], "OSD-379")
        self.assertIn("RNA sequencing", payload["study"]["available_measurements"][0])
        self.assertFalse(payload["study"]["numerical_values_imported"])
        self.assertEqual(payload["additional_studies"][0]["accession"], "OSD-202")
        self.assertIn("not direct astronaut health telemetry", payload["additional_studies"][0]["study_scope"])
        self.assertIn("simulated astronaut telemetry", payload["distinction"])


if __name__ == "__main__":
    unittest.main()
