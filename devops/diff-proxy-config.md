DevOps Diff: Proxy configuration to preserve /llamaproxws

- Change: Ensure reverse proxy routes websocket connections to /llamaproxws only, block alternatives.
- Rationale: Prevent path drift that could break handshake and real-time updates.

- Acceptance: /llamaproxws is the canonical websocket path observed by client and server.
