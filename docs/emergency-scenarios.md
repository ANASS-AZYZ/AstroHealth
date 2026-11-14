# Emergency Scenarios

The command center includes six deterministic demonstration scenarios:

1. Sleep Deprivation
2. Elevated Workload
3. Isolation Stress
4. Elevated Radiation Environment
5. Communication Delay
6. Habitat Environmental Warning

Each scenario declares starting conditions, affected indicators, parameters, actions, assumptions, and expected outcomes in `backend/services/command_service.py`.
Scenario activation records the baseline measurement. Applying an action records before/after values and a mission event. Actions are bounded to the existing simulator measurement ranges.

Radiation is modeled only as an environmental dose-rate indicator. No symptom or medical conclusion is inferred from it.
