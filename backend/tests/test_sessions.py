import unittest

from services.session_service import SessionCapacityError, SessionManager


class SessionIsolationTests(unittest.TestCase):
    def test_sessions_have_independent_mission_state(self):
        manager = SessionManager()
        first_id, first, _ = manager.get(None)
        second_id, second, _ = manager.get(None)

        self.assertNotEqual(first_id, second_id)
        first.simulator.start()
        first.simulator.advance(2)

        self.assertEqual(second.simulator.state().tick, 0)
        self.assertEqual(first.simulator.state().tick, 2)

    def test_existing_session_is_reused(self):
        manager = SessionManager()
        session_id, original, _ = manager.get(None)
        reused_id, reused, is_new = manager.get(session_id)

        self.assertEqual(session_id, reused_id)
        self.assertIs(original, reused)
        self.assertFalse(is_new)

    def test_expired_session_is_replaced(self):
        clock = [100.0]
        manager = SessionManager(ttl_seconds=10, now=lambda: clock[0])
        session_id, _, _ = manager.get(None)
        clock[0] = 111.0

        replacement_id, _, is_new = manager.get(session_id)

        self.assertNotEqual(session_id, replacement_id)
        self.assertTrue(is_new)

    def test_capacity_can_evict_oldest_session(self):
        clock = [100.0]
        manager = SessionManager(max_active=1, now=lambda: clock[0])
        first_id, _, _ = manager.get(None)
        clock[0] = 101.0
        second_id, _, is_new = manager.get(None)

        self.assertTrue(is_new)
        self.assertNotEqual(first_id, second_id)

    def test_capacity_error_can_be_configured(self):
        manager = SessionManager(max_active=1, eviction_enabled=False)
        manager.get(None)

        with self.assertRaises(SessionCapacityError):
            manager.get(None)
