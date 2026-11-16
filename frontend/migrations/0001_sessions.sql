CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window INTEGER NOT NULL,
  count INTEGER NOT NULL
);
