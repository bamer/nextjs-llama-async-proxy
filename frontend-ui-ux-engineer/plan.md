Frontend UI/UX Engineer Subagent Plan (frontend-ui-ux-engineer)
- Objective: Enforce event-driven UI contracts, handshake tests for websocket path, remove polling.

- Tasks:
  1. Refactor UI components to rely solely on Socket.IO broadcasts for state updates.
  2. Implement handshake tests for websocket path (/llamaproxws) ensuring path alignment with server.
  3. Remove any timer-based polling from UI (setInterval/setTimeout wrappers) and replace with socket subscriptions.
  4. Prepare test diffs and lsp diagnostics stubs for changed UI files.

- Diffs placeholders will include:
  - public/js/pages/* components changes
  - public/js/services/socket.js handshake adjustments

- Acceptance: All UI changes pass handshake tests and rely exclusively on socket broadcasts.
