import os
from collections import defaultdict, deque
from threading import RLock
from time import monotonic

from fastapi import HTTPException, Request
from services.config import load_config


class RateLimitExceeded(Exception):
    pass


class ProcessRateLimiter:
    """Best-effort per-process limiter; use an edge limiter for multi-instance deployments."""

    def __init__(self, now=monotonic):
        self._now = now
        self._lock = RLock()
        self._requests: dict[tuple[str, str], deque[float]] = defaultdict(deque)

    def check(self, bucket: str, key: str, limit: int, window_seconds: int = 60) -> None:
        if limit <= 0:
            raise RateLimitExceeded("This operation is temporarily unavailable.")
        now = self._now()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = self._requests[(bucket, key)]
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()
            if len(timestamps) >= limit:
                raise RateLimitExceeded("Rate limit exceeded; retry shortly.")
            timestamps.append(now)


session_rate_limiter = ProcessRateLimiter()
mutation_rate_limiter = ProcessRateLimiter()
report_rate_limiter = ProcessRateLimiter()
comparison_rate_limiter = ProcessRateLimiter()


def _client_key(request: Request) -> str:
    # Do not trust X-Forwarded-For from an arbitrary client.
    return request.client.host if request.client else "unknown"


def _enforce(request: Request, limiter: ProcessRateLimiter, env_name: str, bucket: str) -> None:
    try:
        limiter.check(bucket, _client_key(request), int(os.getenv(env_name, "60")))
    except RateLimitExceeded as error:
        raise HTTPException(
            status_code=429,
            detail=str(error),
            headers={"Retry-After": "60"},
        ) from error


def _enforce_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if origin and origin not in load_config().allowed_origins:
        raise HTTPException(status_code=403, detail="Request origin is not allowed.")


def enforce_session_creation(request: Request) -> None:
    _enforce(request, session_rate_limiter, "RATE_LIMIT_SESSION_PER_MINUTE", "session")


def enforce_mutation(request: Request) -> None:
    _enforce_origin(request)
    _enforce(request, mutation_rate_limiter, "RATE_LIMIT_MUTATION_PER_MINUTE", "mutation")


def enforce_report(request: Request) -> None:
    _enforce(request, report_rate_limiter, "RATE_LIMIT_REPORT_PER_MINUTE", "report")


def enforce_comparison(request: Request) -> None:
    _enforce_origin(request)
    _enforce(request, comparison_rate_limiter, "RATE_LIMIT_COMPARISON_PER_MINUTE", "comparison")
