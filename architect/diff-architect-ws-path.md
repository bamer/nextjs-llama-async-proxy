Architect Diff: Websocket path stabilization and startup watchdog

Summary of intended changes (high-level diff content):
- Server: listen/upgrade on /llamaproxws; ensure io path matches client connection.
- Client: connect to /llamaproxws; ensure socket path is consistent when bundling in client code.
- Add startup watchdog: on startup, spawn watchdog timer; if no heartbeat/presence of llama-router within timeout, trigger restart of router process.
- Presets loader: Enhance presets loader with retry logic, exponential backoff, timeout guards, and fallback behavior.

Notes:
- Actual patch content will be generated in a real code change; this is a placeholder for orchestration.
