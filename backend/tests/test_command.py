import unittest

from services.command_service import command_service
from services.mission_simulator import mission_simulator


class CommandServiceTests(unittest.TestCase):
    def setUp(self):
        command_service.reset()

    def test_actions_have_different_bounded_outcomes(self):
        command_service.activate("elevated_workload")
        command_service.respond("reduce_activity")
        reduced = mission_simulator.state().health.workload_index

        command_service.reset()
        command_service.activate("elevated_workload")
        command_service.respond("continue_monitoring")
        continued = mission_simulator.state().health.workload_index

        self.assertNotEqual(reduced, continued)
        self.assertGreaterEqual(reduced, 0)
        self.assertLessEqual(continued, 100)

    def test_messages_deliver_on_simulated_clock(self):
        command_service.activate("communication_delay")
        command_service.send_message("status request")
        self.assertFalse(command_service.messages()[0].delivered)

        mission_simulator.start()
        mission_simulator.advance(22)
        self.assertTrue(command_service.messages()[0].delivered)

    def test_reset_clears_active_scenario_and_mission_state(self):
        command_service.activate("sleep_deprivation")
        command_service.respond("continue_schedule")
        command_service.reset()

        self.assertIsNone(command_service.state()["active_scenario"])
        self.assertEqual(mission_simulator.state().tick, 0)


if __name__ == "__main__":
    unittest.main()
