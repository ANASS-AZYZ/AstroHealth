# Response Model

Response actions use explicit additive effects, for example:

```text
Schedule Recovery:
  workload_index -12
  fatigue_index -7
  heart_rate -3
```

The shared simulator clamps every changed indicator to its declared range, advances mission time by one simulated hour, appends telemetry, and re-evaluates existing demonstration alert rules. The same action from the same initial state therefore produces the same result; no separate telemetry generator is created.

Communication delay is also mission-clock based. A message sent at `T+n` is pending until the current simulated time reaches `T+n+delay`. It does not represent real network latency.

The model is not clinically calibrated and cannot determine astronaut fitness, diagnose conditions, or prescribe real responses.
