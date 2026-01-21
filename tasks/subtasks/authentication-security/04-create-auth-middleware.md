### Subtask: 04-create-auth-middleware.md

**Objective:** Create authentication middleware for API routes

**Requirements:**
- Create middleware function for JWT validation
- Create middleware for permission checking
- Update src/middleware.ts to include auth middleware
- Handle unauthorized requests properly
- Return appropriate HTTP status codes

**Implementation:**
- Add auth middleware functions to src/lib/auth.ts
- Update main middleware.ts to include authentication
- Create helper functions for route protection
- Add proper error responses for auth failures

**Validation:**
- Middleware properly validates JWT tokens
- Unauthorized requests are rejected with 401
- Forbidden requests are rejected with 403
- Authenticated requests proceed normally</content>
<parameter name="filePath">tasks/subtasks/authentication-security/04-create-auth-middleware.md