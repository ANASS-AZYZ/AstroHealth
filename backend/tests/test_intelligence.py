import unittest

from models.intelligence import ScenarioComparisonRequest
from services.comparison_service import compare_scenarios
from services.event_service import mission_event_store
from services.mission_simulator import MissionSimulator


class IntelligenceTests(unittest.TestCase):
    def setUp(self):
        mission_event_store.reset()

    def test_command_events_are_not_created_by_state_reads(self):
        simulator = MissionSimulator(seed=7)
        simulator.start()
        event_count = len(mission_event_store.all())
        simulator.state()
        simulator.state()
        self.assertEqual(len(mission_event_store.all()), event_count)

    def test_comparison_does_not_change_authoritative_event_history(self):
        simulator = MissionSimulator(seed=9)
        simulator.start()
        before = len(mission_event_store.all())
        result = compare_scenarios(
            ScenarioComparisonRequest(scenario_a="nominal", scenario_b="eva_activity", ticks=4),
            seed=simulator.state().seed,
        )
        self.assertEqual(result.seed, 9)
        self.assertEqual(len(mission_event_store.all()), before)
        self.assertEqual(len(result.series), 4)


if __name__ == "__main__":
    unittest.main()
