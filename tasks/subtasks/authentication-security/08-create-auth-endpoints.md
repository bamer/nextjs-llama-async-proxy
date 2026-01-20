### Subtask: 08-create-auth-endpoints.md

**Objective:** Create authentication endpoints (login/register)

**Requirements:**
- Create /api/auth/login endpoint
- Create /api/auth/register endpoint (admin only)
- Create /api/auth/me endpoint for current user info
- Implement proper request/response validation
- Handle authentication errors gracefully

**Implementation:**
- Create src/app/api/auth/login/route.ts
- Create src/app/api/auth/register/route.ts
- Create src/app/api/auth/me/route.ts
- Use authentication utilities from auth.ts
- Return appropriate JWT tokens and user info

**Validation:**
- Login endpoint authenticates users correctly
- Register endpoint creates new users (admin only)
- Me endpoint returns current user info
- Proper error handling for invalid credentials</content>
<parameter name="filePath">tasks/subtasks/authentication-security/08-create-auth-endpoints.md