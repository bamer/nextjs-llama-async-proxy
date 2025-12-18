# Coding Standards for this Project

## Quick Reference
**Core Philosophy**: Modular, Functional, Maintainable
**Golden Rule**: If you can't easily test it, refactor it

**Critical Patterns** (use these):
- ✅ Pure functions (same input = same output, no side effects)
- ✅ Immutability (create new data, don't modify)
- ✅ Composition (build complex from simple)
- ✅ Small functions (< 50 lines)
- ✅ Explicit dependencies (dependency injection)

**Anti-Patterns** (avoid these):
- ❌ Mutation, side effects, deep nesting
- ❌ God modules, global state, large functions

## Core Philosophy

**Modular**: Everything is a component - small, focused, reusable
**Functional**: Pure functions, immutability, composition over inheritance
**Maintainable**: Self-documenting, testable, predictable
**Do not Simulate or Mok API, functions or value, implement if missing (Except when you create tests files).
**Do not remove already implemented functionality except if you are explicitly invited to do by the user and the user is confirming it.


## Principles

### Modular Design
- Single responsibility per module
- Clear interfaces (explicit inputs/outputs)
- Independent and composable
- < 100 lines per component (ideally < 50)

### Functional Approach
- **Pure functions**: Same input = same output, no side effects
- **Immutability**: Create new data, don't modify existing
- **Composition**: Build complex from simple functions
- **Declarative**: Describe what, not how

### Component Structure
```
component/
├── index.js      # Public interface
├── core.js       # Core logic (pure functions)
├── utils.js      # Helpers
└── tests/        # Tests
```

## Patterns

### Pure Functions
```javascript
// ✅ Pure
const add = (a, b) => a + b;
const formatUser = (user) => ({ ...user, fullName: `${user.firstName} ${user.lastName}` });

// ❌ Impure (side effects)
let total = 0;
const addToTotal = (value) => { total += value; return total; };
```

### Immutability
```javascript
// ✅ Immutable
const addItem = (items, item) => [...items, item];
const updateUser = (user, changes) => ({ ...user, ...changes });

// ❌ Mutable
const addItem = (items, item) => { items.push(item); return items; };
```

### Composition
```javascript
// ✅ Compose small functions
const processUser = pipe(validateUser, enrichUserData, saveUser);
const isValidEmail = (email) => validateEmail(normalizeEmail(email));

// ❌ Deep inheritance
class ExtendedUserManagerWithValidation extends UserManager { }
```

### Declarative
```javascript
// ✅ Declarative
const activeUsers = users.filter(u => u.isActive).map(u => u.name);

// ❌ Imperative
const names = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) names.push(users[i].name);
}
```

## Naming

- **Files**: lowercase-with-dashes.js
- **Functions**: verbPhrases (getUser, validateEmail)
- **Predicates**: isValid, hasPermission, canAccess
- **Variables**: descriptive (userCount not uc), const by default
- **Constants**: UPPER_SNAKE_CASE

## Error Handling

```javascript
// ✅ Explicit error handling
function parseJSON(text) {
  try {
    return { success: true, data: JSON.parse(text) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ✅ Validate at boundaries
function createUser(userData) {
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  return { success: true, user: saveUser(userData) };
}
```

## Dependency Injection

```javascript
// ✅ Dependencies explicit
function createUserService(database, logger) {
  return {
    createUser: (userData) => {
      logger.info('Creating user');
      return database.insert('users', userData);
    }
  };
}

// ❌ Hidden dependencies
import db from './database.js';
function createUser(userData) { return db.insert('users', userData); }
```

## Anti-Patterns

❌ **Mutation**: Modifying data in place
❌ **Side effects**: console.log, API calls in pure functions
❌ **Deep nesting**: Use early returns instead
❌ **God modules**: Split into focused modules
❌ **Global state**: Pass dependencies explicitly
❌ **Large functions**: Keep < 50 lines

## Best Practices

✅ Pure functions whenever possible
✅ Immutable data structures
✅ Small, focused functions (< 50 lines)
✅ Compose small functions into larger ones
✅ Explicit dependencies (dependency injection)
✅ Validate at boundaries
✅ Self-documenting code
✅ Test in isolation

**Golden Rule**: If you can't easily test it, refactor it.

## 1. Typescript & Type Safety
- Use strict Typescript (`strict` mode enabled in `tsconfig.json`).
- **No `any`** – explicitly type all variables, function parameters, and return values.
- Define interfaces for all public APIs and component props.
- Prefer `readonly` for immutable values.
- Do not Simulate or Mok API, functions or value, implement if missing (Except when you create tests files).
- Do not remove already implemented functionality except if you are explicitly invited to do by the user and the user is confirming it.

## 2. Module Imports
- Group imports logically:
  1. React libraries (`import React from 'react'`, etc.)
  2. Third‑party libraries
  3. Internal utilities (`src/lib/...`)
  4. CSS/module styles
- Use path aliases defined in `tsconfig.json` (e.g., `@/components`).
- Avoid relative imports outside of test files.

## 3. Naming Conventions
- **Constants & Enums**: `UPPER_SNAKE_CASE`
- **Functions & Variables**: `camelCase`
- **Component Names**: `PascalCase`
- **File Names**: Match exported name, kebab-case for directories (`model-page.tsx`).

## 4. File Structure & Organization
- Keep related components, hooks, and utilities within feature directories (`src/components/feature/`, `src/lib/`).
- Place shared utilities in `src/lib/` and export via index barrel (`index.ts`).
- Use feature‑specific sub‑directories for tests (`__tests__/` or `__tests__/feature.test.tsx`).

## 5. State Management
- Centralise long‑lived state in `src/lib/state.ts` (JSON file on disk).
- Load state on startup, persist on every mutation using atomic write.
- Do **not** keep transient process IDs or binary paths in memory without persisting.

## 6. Process Management
- Spawn external processes (e.g., `llama.cpp`) using `child_process` with `detached: true`.
- Track PIDs and lifecycle in `src/lib/process-manager.ts`.
- Provide clean `stopProcess(pid)` that sends SIGTERM and waits for cleanup.
- Validate that the binary exists before spawning.

## 7. Binary Resolution
- Model binaries live under `data/models/<name>/model.bin`.
- Resolve paths via a dedicated resolver (`src/lib/binary-lookup.ts`).
- Throw a clear error if the binary is missing or inaccessible.

## 8. Logging
- Use the provided `src/lib/logger.ts` (Winston with daily rotation).
- Log structured JSON with timestamps, request IDs, and severity levels.
- Do **not** log sensitive data (e.g., full model weights) to console.

## 9. Error Handling
- Centralise error types in `src/lib/errors.ts`.
- Propagate errors with meaningful HTTP status codes in API routes.
- Never swallow errors – always log and re‑throw or fallback gracefully.

## 10. Testing
- Write unit tests for pure utilities (`state`, `process-manager`, `binary-lookup`).
- Integration tests for API routes that involve process spawning.
- Use `pnpm test` and ensure 100 % coverage on new code.
- Mock external dependencies (fs, child_process) to avoid side effects.

## 11. Documentation
- Keep API docs in `src/app/api/` with route descriptions.
- Generate Swagger/OpenAPI snippets for public endpoints.
- Update `README.md` with setup and run instructions.

---  
*All new code must adhere to the above standards before merging.*
