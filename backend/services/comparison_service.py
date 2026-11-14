from models.intelligence import ScenarioComparison, ScenarioComparisonRequest
from services.mission_simulator import MissionSimulator
from services.scenario_engine import get_scenario, scenario_summary


METRICS = [
    ("heart_rate", "BPM"),
    ("oxygen_saturation", "%"),
    ("sleep_hours", "hours"),
    ("stress_index", "index (0-100)"),
    ("fatigue_index", "index (0-100)"),
    ("workload_index", "index (0-100)"),
    ("radiation_dose_rate", "mSv/day"),
]


def compare_scenarios(request: ScenarioComparisonRequest, seed: int) -> ScenarioComparison:
    results = []
    for scenario in (request.scenario_a, request.scenario_b):
        simulator = MissionSimulator(seed=seed, track_events=False)
        simulator.set_scenario(scenario)
        simulator.start()
        simulator.advance(request.ticks)
        results.append(simulator.history())

    final_a, final_b = results[0][-1], results[1][-1]
    metrics = []
    for metric, unit in METRICS:
        value_a = float(final_a[metric])
        value_b = float(final_b[metric])
        difference = round(value_b - value_a, 2)
        percentage = round((difference / abs(value_a)) * 100, 2) if value_a else None
        metrics.append({
            "metric": metric,
            "unit": unit,
            "scenario_a": value_a,
            "scenario_b": value_b,
            "absolute_difference": difference,
            "percentage_difference": percentage,
        })

    series = [
        {
            "tick": index + 1,
            "scenario_a": round(item_a["stress_index"], 2),
            "scenario_b": round(item_b["stress_index"], 2),
            "scenario_a_fatigue": round(item_a["fatigue_index"], 2),
            "scenario_b_fatigue": round(item_b["fatigue_index"], 2),
        }
        for index, (item_a, item_b) in enumerate(zip(results[0], results[1]))
    ]
    return ScenarioComparison(
        scenario_a=scenario_summary(get_scenario(request.scenario_a)),
        scenario_b=scenario_summary(get_scenario(request.scenario_b)),
        seed=seed,
        ticks=request.ticks,
        metrics=metrics,
        series=series,
        explanation="Both isolated runs use the same seed, baseline, phase, duration, and time steps. Outputs are illustrative model results, not validated predictions of astronaut physiology.",
    )
