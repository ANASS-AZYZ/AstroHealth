import unittest

from services.demo_service import demo_service
from services.mission_simulator import mission_simulator


class GuidedDemoTests(unittest.TestCase):
    def setUp(self):
        demo_service.exit()

    def test_preset_is_deterministic_and_triggers_real_alert(self):
        first = demo_service.start()
        first_health = first.mission["health"]
        first_alerts = first.alert_count
        demo_service.exit()

        second = demo_service.start()
        second_health = second.mission["health"]

        self.assertEqual(first.seed, 7042)
        first_health.pop("timestamp", None)
        second_health.pop("timestamp", None)
        self.assertEqual(first_health, second_health)
        self.assertGreaterEqual(first_alerts, 1)
        demo_service.exit()

    def test_exit_restores_previous_mission_state(self):
        before = mission_simulator.state()
        demo_service.start()
        demo_service.advance(1)
        restored = demo_service.exit()

        after = mission_simulator.state()
        self.assertFalse(restored.active)
        self.assertEqual(after.seed, before.seed)
        self.assertEqual(after.tick, before.tick)
        self.assertEqual(after.health.model_dump(exclude={"timestamp"}), before.health.model_dump(exclude={"timestamp"}))


if __name__ == "__main__":
    unittest.main()
