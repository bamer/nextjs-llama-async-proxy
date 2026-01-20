# Context Bundle - Project Standards & Constraints

## 1. Coding Standards (code.md)
- **Modular & Functional**: Small, pure functions; avoid side effects.
- **Immutability**: Never mutate state directly; return new copies.
- **Pure Functions**: Same input → same output; no hidden dependencies.
- **Error Handling**: Use explicit error objects; never swallow errors.
- **Input Validation**: Validate all external inputs; return clear errors.
- **No `any`**: All TypeScript types must be explicit.
- **Dependency Injection**: Declare dependencies explicitly; avoid hidden globals.

## 2. Module Imports Order
1. React libraries (`import React from 'react'`, etc.)
2. Third‑party packages
3. Internal utilities (`src/lib/...`)
4. CSS/Module styles

## 3. Naming Conventions
- **Constants**: `UPPER_SNAKE_CASE`
- **Functions/Variables**: `camelCase`
- **Components**: `PascalCase`
- **Files**: Match export name; kebab-case for directories

## 4. File Structure
```
src/
├─ app/            # Next.js App Router
├─ components/     # UI components (layout, pages, ui, websocket)
├─ lib/            # Shared utilities & state
├─ config/         # Application configuration
└─ types/          # TypeScript interfaces & enums
```

## 5. State Management
- Centralized state in `src/lib/state.ts` (JSON on disk).
- Persist mutations atomically.
- No transient process IDs in memory.

## 6. Process Management
- Spawn external processes with `detached: true`.
- Track PIDs & lifecycle in `src/lib/process-manager.ts`.
- Provide clean `stopProcess(pid)` with SIGTERM.

## 7. Binary Resolution
- Binaries under `data/models/<name>/model.bin`.
- Resolve via `src/lib/binary-lookup.ts`.
- Throw clear errors if missing.

## 8. Logging
- Use `src/lib/logger.ts` (Winston with daily rotation).
- Structured JSON logs: timestamp, requestId, level.
- Never log secrets.

## 9. Error Handling
- Centralized error types in `src/lib/errors.ts`.
- Map to appropriate HTTP status codes.
- Propagate errors; never swallow.

## 10. Testing
- Unit tests for pure utilities.
- Integration tests for API routes & process spawning.
- 100% coverage on new code.
- Mock external deps (fs, child_process) only in test files.

## 11. Documentation
- API docs in `src/app/api/` with route descriptions.
- Generate Swagger/OpenAPI snippets.
- Update `README.md` with setup/run instructions.

## 12. Security
- No hardcoded secrets; use env vars.
- Sanitize all user input.
- Prevent path traversal; validate file paths.
- Log structured JSON; avoid sensitive data.

## 13. Performance
- Cache expensive calculations.
- Use efficient data structures.
- Profile before optimizing.
- Leverage Next.js automatic code splitting & image optimization.

## 14. Dependencies
- Pin versions in `package.json`.
- Audit for security vulnerabilities.
- Document rationale for each dependency.

## 15. Version Control
- Atomic commits with descriptive messages.
- Feature branches for development.
- Keep `main` stable; require reviews.

## 16. Common Anti‑Patterns
- Mutation & side effects in pure functions.
- God modules / large functions (>50 lines).
- Global state without explicit injection.
- Unexplicit dependencies / hidden globals.
- Ignoring validation & error handling.

## 17. Validation & Error Handling
- Validate at boundaries (API, config, file I/O).
- Return structured error objects with clear messages.
- Log errors with context; never expose internals to clients.

## 18. Real‑Time Data Requirement
- All API services must use **real, live data** – no mocks or simulated datasets.
- Integrate real data sources (databases, WebSocket feeds, external APIs).
- Ensure data pipelines are resilient and include proper error handling.

## 19. Analysis Guidelines (analysis.md)
- **Process**: Context → Gather → Patterns → Impact → Recommendations
- **Be**: Thorough, Objective, Specific, Actionable
- **Checklist**: Context stated, Evidence gathered, Patterns identified, Issues prioritized, Recommendations specific, Trade-offs considered
- **Format**: Analysis: {Topic} with Context, Findings, Patterns, Issues (🔴🟡🔵), Recommendations, Trade-offs, Next Steps

## 20. Essential Patterns (patterns.md)
- **Error Handling**: Catch specific errors, log with context, return meaningful messages.
- **Validation**: Check null/nil, types, ranges, sanitize input.
- **Logging**: Debug (dev), Info (milestones), Warning (potential issues), Error (failures).
- **Security**: Never expose secrets, validate/sanitize input, use env vars.
- **File System Safety**: Prevent path traversal, check permissions, use absolute paths.
- **Configuration**: Use env vars, validate required config, document options.
- **Testing**: Write testable code, dependency injection, pure functions, unit & integration tests.
- **Documentation**: Document “why”, parameters, return values, usage examples.
- **Performance**: Cache, efficient data structures, profile before optimizing.
- **Code Organization**: Single Responsibility, DRY, separate concerns, meaningful names, small functions.
- **Dependency Management**: Pin versions, audit security, minimize dependencies.
- **Version Control**: Atomic commits, descriptive messages, feature branches, review before merge.
- **Code Review Checklist**: Error handling, validation, no hardcoded secrets, tests coverage, documentation, conventions, security, performance.

---  
*All new code must adhere to the above standards before merging.*