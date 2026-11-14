import os
from dataclasses import dataclass


DEFAULT_ORIGINS = (
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
)


@dataclass(frozen=True)
class RuntimeConfig:
    environment: str
    allowed_origins: tuple[str, ...]
    session_cookie_secure: bool
    session_cookie_samesite: str


def load_config() -> RuntimeConfig:
    origins = tuple(
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
        if origin.strip()
    )
    config = RuntimeConfig(
        environment=os.getenv("APP_ENV", "development").lower(),
        allowed_origins=origins,
        session_cookie_secure=os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true",
        session_cookie_samesite=os.getenv("SESSION_COOKIE_SAMESITE", "lax").lower(),
    )
    validate_config(config)
    return config


def validate_config(config: RuntimeConfig) -> None:
    if config.session_cookie_samesite not in {"lax", "strict", "none"}:
        raise RuntimeError("SESSION_COOKIE_SAMESITE must be lax, strict, or none.")
    if config.environment != "production":
        return
    if not config.allowed_origins or "*" in config.allowed_origins:
        raise RuntimeError("Production requires explicit ALLOWED_ORIGINS; wildcard CORS is unsafe.")
    if any(not origin.startswith("https://") for origin in config.allowed_origins):
        raise RuntimeError("Production ALLOWED_ORIGINS must contain only HTTPS origins.")
    if not config.session_cookie_secure or config.session_cookie_samesite != "none":
        raise RuntimeError("Production cross-site sessions require Secure cookies and SameSite=None.")
