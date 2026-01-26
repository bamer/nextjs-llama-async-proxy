Socket.IO Contract Overview

This document codifies the Socket.IO event contracts used by the Llama Async Proxy Dashboard. It covers server-side domain handlers, client-facing API, and broadcast semantics to ensure consistent integration across frontend and backend.

1) Event naming convention
- Domain:action for requests and domain:action for broadcasts (e.g., models:list, models:updated, metrics:subscribe).
- Responses to requests are delivered via the callback pattern, returning an object with { success, data?, error?, timestamp }.

2) Server-side contracts (per-domain)
- Models domain
  - Request: models:list -> callback({ success, data: { models }, timestamp })
  - Broadcast: models:updated -> io.emit or socket.broadcast.emit depending on scope
  - Optional: models:load, models:unload with corresponding responses and broadcasts
- Metrics domain
  - Request: metrics:get or metrics:subscribe -> callback with metrics data; may broadcast metrics:updated
  - Broadcast: metrics:updated -> io.emit to all subscribers
- Logs domain
  - Request: logs:list / logs:get -> callback with log data
  - Broadcast: logs:entry / logs:cleared -> io.emit or socket.broadcast.emit
- Config domain
  - Request: config:get / config:update -> callback with config data or status
  - Broadcast: config:updated after changes
- Llama domain
  - Request: llama:status / llama:start / llama:stop -> callback with status; broadcasts with llama:status
- Presets domain
  - Request: presets:list / presets:read / presets:save -> callback with presets data
  - Broadcast: presets:updated on changes

3) Client contracts (vanilla JS)
- Socket.IO client wrapper exposes:
  - connect(), disconnect(), on(event, cb), off(event, cb), emit(event, data), request(event, data)
- All state changes come from broadcasts; actions are initiated via requests with a callback/promise.

4) Broadcasting rules
- io.emit("event", data) sends to all connected clients, including the sender.
- socket.broadcast.emit("event", data) sends to all clients except the sender.
- io.to(room).emit(...) targets only the specified room(s).

5) Version notes
- This contract is aligned with Socket.IO v4 behaviour. See official migration notes for breaking changes in v3→v4, particularly around to() chaining semantics.

References: bg_bebcdb16, bg_9fda7f6b, bg_8f3287b9
