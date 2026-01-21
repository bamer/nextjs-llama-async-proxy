Frontend Handshake Diff: /llamaproxws handshake and UI contracts

Summary of intended changes (high-level):
- Introduce explicit handshake test scaffolding for websocket path: /llamaproxws.
- Remove any polling in components; replace with socket.on('event') subscriptions.
- Update socket consumption in components to rely on broadcasted payloads.

- LSP Diagnostics Placeholder:
- public/js/services/socket.js: ensure path property is '/llamaproxws' and used consistently.
