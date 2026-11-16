# Cloudflare migration plan

1. Inventory every FastAPI route from the application registry, request models, service dependencies, tests, and all React consumers. Save the inventory and reference fixtures before changing the proxy.
2. Port the deterministic simulator (including Python's seeded MT19937 sequence), alerts, events, statistics, readiness, comparisons, command actions/messages, demo snapshot/restore, curated NASA metadata, and exports into reusable Workers ES modules.
3. Persist the complete session in D1 with optimistic version checks. Retry conflicts against fresh state; return a response only after committing its state. Use opaque random HttpOnly same-origin cookies and one-hour idle expiry. Fail closed if storage is missing or unavailable.
4. Preserve the public API and frontend presentation. Generate PDFs directly using a small Workers-compatible PDF writer. Keep Python unchanged.
5. Compare contracts and deterministic numerical outputs with Python fixtures; test concurrency, expiry, cookies, validation, and page-level API workflows. Run Python tests, frontend lint/build, and local Workers/D1 checks.
6. Replace the proxy only after route coverage passes. Document D1 setup, preview verification, production deployment commands, quotas, and limitations. Do not deploy.

## Storage decision

- KV: rejected for simulator state because eventual consistency and concurrent writes can lose ticks.
- Durable Objects: SQLite-backed objects are free-tier eligible and serialize sessions well, but Pages requires a separate Worker deployment to define the class. Viable alternative with greater operational scope.
- Signed stateless cookies: rejected because history, events, acknowledgements, messages, and demo snapshots exceed cookie limits; concurrent requests would overwrite state and replay old snapshots.
- D1: selected. Native Pages binding; atomic conditional updates prevent lost changes, including reads with side effects. No global session map. Use primary reads (no read replication). Session payloads are bounded explicitly, with a recoverable capacity error rather than silently truncating history.

Official references checked 2026-11-16: [Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/), [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
