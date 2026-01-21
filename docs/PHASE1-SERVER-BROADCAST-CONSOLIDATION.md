Phase 1: Server Broadcast Consolidation (100%)

Goal
- Ensure all cross-client status/notification events are broadcast to all other clients without echoing to the sender.
- Use a consistent Socket.IO contract: socket.broadcast.emit for events that must be seen by others, io.emit only when you want the sender to receive the update as well (rare in our case).

What was done in Phase 1
- llama.js: Added per-socket broadcast for status related events and removed global/Gateway emissions that could emit from a non-socket context.
- llama-router/process-handlers.js: Converted status broadcasts to socket.broadcast.emit for cross-client synchronization.
- gpu-handler.js: Replaced gpu:updated broadcasts with socket.broadcast.emit.
- llama-router/process-handlers.js: Added an additional relay for start/stop status via bus-emit pattern to other clients.
- Added a new: llama:server:event listener in server/handlers/llama.js to allow future event propagation without echo.

Test Plan (unit/integration)
- Phase 1A: Sender-not-broadcast test
  - Simulate a client sending a status update; assert that the sender does not receive the broadcast, but other connected clients do.
- Phase 1B: Broadcast coverage test
  - With two mock sockets (A, B), trigger a status update from A and verify B gets llama-server-status broadcast while A does not receive its own update.
- Phase 1C: No unintended broadcasts
  - Ensure unrelated events continue to use their intended path; there are no stray io.emit() calls for cross-client status.

Patch notes
- File releases are patch-based in small, reviewable commits.
- Commits should be small and describe the why, not only the what.
