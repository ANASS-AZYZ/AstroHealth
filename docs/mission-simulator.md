# Mars Mission Simulator

The simulator is an in-memory FastAPI demonstration driven by one shared mission state. It supports seven mission phases, six illustrative scenarios, deterministic seeded randomness, pause/resume/reset, controlled advancement, and speed settings.

Telemetry values are bounded synthetic measurements. The mission clock is simulated time in hours and is separate from wall-clock time. Radiation is represented as an illustrative environmental dose-rate indicator in `mSv/day`; it is not NASA mission data and is not translated into immediate health effects.

## Repeatable alert demonstration

1. Start the backend and open `/mission-simulator`.
2. Select **Elevated Radiation Environment**.
3. Start the simulation and advance enough ticks for the environmental indicator to cross the configured demonstration threshold.
4. Open **Risk Alerts** to review and acknowledge the generated alert.

The scenarios and thresholds are educational assumptions, not validated physiological or NASA medical models.
