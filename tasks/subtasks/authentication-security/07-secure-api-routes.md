### Subtask: 07-secure-api-routes.md

**Objective:** Apply authentication and RBAC to API routes

**Requirements:**
- Update API routes to use authentication middleware
- Apply appropriate permissions to each route
- Modify route handlers to use authenticated user context
- Ensure proper error handling for unauthorized access

**Implementation:**
- Update src/app/api/models/route.tsx with auth middleware
- Update other API routes with appropriate permissions
- Use withAuth, withPermission, and withRole helpers
- Maintain existing functionality while adding security

**Validation:**
- API routes require authentication
- Permissions are properly enforced
- User context is available in handlers
- Unauthorized requests are rejected</content>
<parameter name="filePath">tasks/subtasks/authentication-security/07-secure-api-routes.md