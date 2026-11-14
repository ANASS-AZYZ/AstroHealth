
import os
import secrets
from dataclasses import dataclass
from threading import RLock
from time import monotonic

from fastapi import HTTPException, Request, Response

from services.alert_engine import AlertStore
from services.command_service import CommandService
from services.event_service import MissionEventStore
from services.mission_simulator import MissionSimulator
from services.rate_limit_service import enforce_session_creation


SESSION_COOKIE = "astrohealth_session"
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "3600"))
SESSION_MAX_ACTIVE = int(os.getenv("SESSION_MAX_ACTIVE", "1000"))
SESSION_EVICTION_ENABLED = (
    os.getenv("SESSION_EVICTION_ENABLED", "true").lower() == "true"
)


@dataclass
class AppSession:
    simulator: MissionSimulator
    alerts: AlertStore
    events: MissionEventStore
    command: CommandService
    demo: "DemoService"
    last_seen: float


class SessionCapacityError(Exception):
    pass


class SessionManager:
    def __init__(
        self,
        max_active: int = SESSION_MAX_ACTIVE,
        ttl_seconds: int = SESSION_TTL_SECONDS,
        eviction_enabled: bool = SESSION_EVICTION_ENABLED,
        now=monotonic,
    ) -> None:
        if max_active < 1:
            raise ValueError("max_active must be at least 1")

        if ttl_seconds < 1:
            raise ValueError("ttl_seconds must be at least 1")

        self._lock = RLock()
        self._sessions: dict[str, AppSession] = {}
        self._max_active = max_active
        self._ttl_seconds = ttl_seconds
        self._eviction_enabled = eviction_enabled
        self._now = now

    def _new(self) -> AppSession:
        alerts = AlertStore()
        events = MissionEventStore()

        simulator = MissionSimulator(
            alerts=alerts,
            events=events,
        )

        # Automatically start the mission for each new session
        simulator.start()

        command = CommandService(
            simulator=simulator,
            events=events,
        )

        from services.demo_service import DemoService

        demo = DemoService(
            simulator=simulator,
            alerts=alerts,
            events=events,
            command=command,
        )

        return AppSession(
            simulator=simulator,
            alerts=alerts,
            events=events,
            command=command,
            demo=demo,
            last_seen=self._now(),
        )

    def get(self, session_id: str | None) -> tuple[str, AppSession, bool]:
        now = self._now()

        with self._lock:
            expired = [
                key
                for key, value in self._sessions.items()
                if now - value.last_seen > self._ttl_seconds
            ]

            for key in expired:
                del self._sessions[key]

            if session_id and session_id in self._sessions:
                session = self._sessions[session_id]
                session.last_seen = now
                return session_id, session, False

            if len(self._sessions) >= self._max_active:
                if not self._eviction_enabled:
                    raise SessionCapacityError(
                        "Session capacity is temporarily full."
                    )

                oldest_id = min(
                    self._sessions,
                    key=lambda key: self._sessions[key].last_seen,
                )
                del self._sessions[oldest_id]

            new_id = secrets.token_urlsafe(32)
            session = self._new()

            self._sessions[new_id] = session

            return new_id, session, True

    def is_active(self, session_id: str | None) -> bool:
        if not session_id:
            return False

        now = self._now()

        with self._lock:
            session = self._sessions.get(session_id)

            if (
                session is None
                or now - session.last_seen > self._ttl_seconds
            ):
                if session is not None:
                    del self._sessions[session_id]

                return False

            return True


session_manager = SessionManager()


def get_session(request: Request, response: Response) -> AppSession:
    incoming_id = request.cookies.get(SESSION_COOKIE)

    if incoming_id and not session_manager.is_active(incoming_id):
        raise HTTPException(
            status_code=401,
            detail="Session expired. Establish a new AstroHealth session.",
            headers={
                "X-AstroHealth-Session-Expired": "true"
            },
        )

    if not incoming_id:
        enforce_session_creation(request)

    try:
        session_id, session, is_new = session_manager.get(incoming_id)

    except SessionCapacityError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    if is_new:
        response.set_cookie(
            SESSION_COOKIE,
            session_id,
            httponly=True,
            secure=(
                os.getenv("SESSION_COOKIE_SECURE", "false").lower()
                == "true"
            ),
            samesite=os.getenv("SESSION_COOKIE_SAMESITE", "lax"),
            max_age=session_manager._ttl_seconds,
        )

    return session


def create_session(
    request: Request,
    response: Response,
    renew: bool = False,
) -> dict[str, str]:
    incoming_id = request.cookies.get(SESSION_COOKIE)

    if (
        not renew
        and incoming_id
        and session_manager.is_active(incoming_id)
    ):
        return {"status": "ready"}

    enforce_session_creation(request)

    try:
        session_id, _, _ = session_manager.get(None)

    except SessionCapacityError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    response.set_cookie(
        SESSION_COOKIE,
        session_id,
        httponly=True,
        secure=(
            os.getenv("SESSION_COOKIE_SECURE", "false").lower()
            == "true"
        ),
        samesite=os.getenv("SESSION_COOKIE_SAMESITE", "lax"),
        max_age=session_manager._ttl_seconds,
    )

    return {"status": "ready"}
