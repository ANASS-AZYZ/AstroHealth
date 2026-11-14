import unittest

from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.requests import Request

from main import app, get_health_history, get_live_health
from routers.mission import get_phases, get_scenarios
from services.config import RuntimeConfig, validate_config
from services.rate_limit_service import ProcessRateLimiter, RateLimitExceeded, enforce_mutation
from services.session_service import SessionManager, session_manager


class PhaseTenTests(unittest.TestCase):
    def test_session_bootstrap_recovers_after_backend_session_loss(self):
        with TestClient(app) as client:
            bootstrap = client.get("/api/session")
            self.assertEqual(bootstrap.status_code, 200)
            self.assertEqual(bootstrap.json()["status"], "ready")
            original_cookie = client.cookies.get("astrohealth_session")
            self.assertEqual(client.get("/api/session").status_code, 200)
            self.assertEqual(client.cookies.get("astrohealth_session"), original_cookie)

            session_manager._sessions.clear()
            expired = client.get("/api/health/history")
            self.assertEqual(expired.status_code, 401)
            self.assertEqual(expired.headers["X-AstroHealth-Session-Expired"], "true")

            renewed = client.get("/api/session")
            self.assertEqual(renewed.status_code, 200)
            self.assertEqual(client.get("/api/health/history").json(), [])

    def test_mission_metadata_endpoints_return_available_options(self):
        self.assertTrue(get_scenarios())
        self.assertTrue(get_phases())

    def test_legacy_health_endpoints_use_simulator_history(self):
        _, session, _ = SessionManager().get(None)
        session.simulator.start()
        session.simulator.advance(2)

        live = get_live_health(session)
        history = get_health_history(session)
        current = session.simulator.state().health

        self.assertEqual(live["heart_rate"], current.heart_rate)
        self.assertEqual(len(history), 2)
        self.assertEqual(history[-1]["heart_rate"], current.heart_rate)

    def test_rate_limiter_rejects_excess_requests_and_expires_window(self):
        clock = [0.0]
        limiter = ProcessRateLimiter(now=lambda: clock[0])
        limiter.check("test", "client", 1)
        with self.assertRaises(RateLimitExceeded):
            limiter.check("test", "client", 1)
        clock[0] = 61.0
        limiter.check("test", "client", 1)

    def test_production_configuration_rejects_insecure_origins_and_cookies(self):
        with self.assertRaises(RuntimeError):
            validate_config(RuntimeConfig("production", ("http://localhost:5173",), True, "none"))
        with self.assertRaises(RuntimeError):
            validate_config(RuntimeConfig("production", ("https://demo.example",), False, "lax"))

    def test_local_configuration_allows_development_defaults(self):
        validate_config(RuntimeConfig("development", ("http://localhost:5173",), False, "lax"))

    def test_state_changing_requests_reject_unapproved_origins(self):
        request = Request({
            "type": "http",
            "method": "POST",
            "headers": [(b"origin", b"https://untrusted.example")],
            "client": ("127.0.0.1", 1234),
        })

        with self.assertRaises(HTTPException) as context:
            enforce_mutation(request)

        self.assertEqual(context.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
