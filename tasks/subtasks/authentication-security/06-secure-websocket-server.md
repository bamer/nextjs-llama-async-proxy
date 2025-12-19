### Subtask: 06-secure-websocket-server.md

**Objective:** Add authentication to WebSocket server

**Requirements:**
- Modify pages/api/websocket.ts to require JWT authentication
- Validate tokens on WebSocket connection
- Attach user context to socket connections
- Handle authentication failures gracefully
- Maintain connection limits and security

**Implementation:**
- Update WebSocket connection handler to validate JWT
- Extract user info from token and attach to socket
- Add connection authorization logic
- Handle invalid tokens and unauthorized connections

**Validation:**
- WebSocket connections require valid JWT
- User context is available on socket
- Unauthorized connections are rejected
- Existing functionality still works for authenticated users</content>
<parameter name="filePath">tasks/subtasks/authentication-security/06-secure-websocket-server.md