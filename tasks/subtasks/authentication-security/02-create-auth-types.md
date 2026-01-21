### Subtask: 02-create-auth-types.md

**Objective:** Create authentication types and interfaces for the security system

**Requirements:**
- Define User interface with id, username, email, role, etc.
- Define AuthToken interface for JWT payload
- Define Role enum (admin, user, viewer)
- Define Permission enum for RBAC
- Add types to src/lib/types.ts

**Implementation:**
- Extend existing types.ts file with authentication types
- Ensure types are properly exported
- Add JSDoc comments for documentation

**Validation:**
- Types compile without errors
- Types are properly exported and importable
- Follow TypeScript best practices</content>
<parameter name="filePath">tasks/subtasks/authentication-security/02-create-auth-types.md