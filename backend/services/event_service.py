from datetime import datetime, timezone
from threading import RLock
from uuid import uuid4

from models.intelligence import MissionEvent
from models.mission import ScenarioName


class MissionEventStore:
    """In-memory mission event history for the single-process prototype."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._events: list[MissionEvent] = []

    def record(
        self,
        event_type: str,
        description: str,
        mission_timestamp: float,
        scenario: ScenarioName,
        metric: str | None = None,
    ) -> MissionEvent:
        event = MissionEvent(
            id=str(uuid4()),
            event_type=event_type,
            description=description,
            mission_timestamp=mission_timestamp,
            recorded_at=datetime.now(timezone.utc).isoformat(),
            scenario=scenario,
            metric=metric,
        )
        with self._lock:
            self._events.append(event)
        return event

    def all(self, event_type: str | None = None) -> list[MissionEvent]:
        with self._lock:
            events = list(self._events)
        if event_type:
            events = [event for event in events if event.event_type == event_type]
        return list(reversed(events))

    def reset(self) -> None:
        with self._lock:
            self._events.clear()

    def snapshot(self) -> list[MissionEvent]:
        with self._lock:
            return list(self._events)

    def restore(self, events: list[MissionEvent]) -> None:
        with self._lock:
            self._events = list(events)


mission_event_store = MissionEventStore()
