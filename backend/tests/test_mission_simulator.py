import unittest

from services.mission_simulator import MissionSimulator


class MissionSimulatorTests(unittest.TestCase):
    def test_paused_simulation_does_not_advance(self):
        simulator = MissionSimulator(seed=11)
        simulator.start()
        simulator.advance(2)
        simulator.pause()
        state_before = simulator.state()
        state_after = simulator.advance(3)

        self.assertEqual(state_before.tick, state_after.tick)
        self.assertEqual(state_before.mission_day, state_after.mission_day)

    def test_reset_restores_seeded_initial_state(self):
        first = MissionSimulator(seed=42)
        first.start()
        first.advance(4)
        expected = first.state().health.model_dump(exclude={"timestamp"})

        second = MissionSimulator(seed=42)
        second.start()
        second.advance(4)
        actual = second.state().health.model_dump(exclude={"timestamp"})

        self.assertEqual(expected, actual)
        second.reset()
        self.assertEqual(second.state().tick, 0)
        self.assertEqual(second.state().health.heart_rate, 72.0)

    def test_scenario_changes_simulated_values_within_bounds(self):
        simulator = MissionSimulator(seed=5)
        simulator.set_scenario("elevated_radiation")
        simulator.start()
        state = simulator.advance(10)

        self.assertGreater(state.health.radiation_dose_rate, 0)
        self.assertLessEqual(state.health.radiation_dose_rate, 5)
        self.assertGreaterEqual(state.health.stress_index, 0)
        self.assertLessEqual(state.health.stress_index, 100)


if __name__ == "__main__":
    unittest.main()
