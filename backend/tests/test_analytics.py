import unittest

from services.alert_engine import AlertStore
from services.anomaly_detector import detect_anomaly
from services.prediction_engine import predict_metric


def measurements(values: list[float], metric: str = "stress_index") -> list[dict]:
    return [{metric: value} for value in values]


class AnalyticsTests(unittest.TestCase):
    def test_prediction_requires_minimum_observations(self):
        prediction = predict_metric(measurements([20, 21]), "stress_index")

        self.assertEqual(prediction.status, "insufficient_data")
        self.assertIsNone(prediction.predicted_value)

    def test_prediction_uses_recent_linear_trend(self):
        prediction = predict_metric(measurements([10, 12, 14, 16]), "stress_index", horizon=2)

        self.assertEqual(prediction.status, "ready")
        self.assertEqual(prediction.predicted_value, 20.0)
        self.assertEqual(prediction.observations, 4)

    def test_anomaly_handles_constant_series_without_division_error(self):
        result = detect_anomaly(measurements([25, 25, 25, 25]), "stress_index")

        self.assertEqual(result.status, "normal")
        self.assertEqual(result.rolling_std, 0.0)

    def test_anomaly_ignores_missing_values(self):
        result = detect_anomaly(
            [{"stress_index": 20}, {"stress_index": None}, {"stress_index": 21}],
            "stress_index",
        )

        self.assertEqual(result.observations, 2)
        self.assertEqual(result.status, "insufficient_data")

    def test_alert_store_deduplicates_and_acknowledges(self):
        store = AlertStore()
        health = {"stress_index": 80}

        first = store.all(health)
        second = store.all(health)

        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 1)
        acknowledged = store.acknowledge(first[0].id)
        self.assertTrue(acknowledged.acknowledged)


if __name__ == "__main__":
    unittest.main()
