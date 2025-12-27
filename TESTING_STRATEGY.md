# Testing Strategy to Achieve 98% Coverage

## Current Status
- **Current Coverage**: 9.01%
- **Target**: 98%
- **Gap**: 88.99 percentage points

## Priority Areas (by impact on coverage)

### TIER 1: High-Impact Utility Functions (0% → Easy wins)
1. **lib/validators.ts** - Validation functions
2. **lib/constants.ts** - Constants  
3. **lib/auth.ts** - Auth utilities
4. **utils/api-client.ts** - API HTTP client (critical)
5. **config/*.ts** - Configuration files

### TIER 2: Core Hooks (0% → High complexity, high value)
1. **hooks/use-api.ts** - Data fetching hook
2. **hooks/use-websocket.ts** - WebSocket communication
3. **hooks/useLlamaStatus.ts** - Llama server status
4. **hooks/useSystemMetrics.ts** - System monitoring
5. **hooks/useSettings.ts** - Settings management

### TIER 3: Missing Component Tests (0-50%)
1. **components/pages/** - All page components (0%)
2. **components/dashboard/ModernDashboard.tsx** - Dashboard (0%)
3. **components/layout/Sidebar.tsx** - Sidebar (0%)
4. **components/dashboard/hooks/useDashboardMetrics.ts** - Dashboard metrics (0%)
5. **components/configuration/hooks/useConfigurationForm.ts** - Config form (0%)

### TIER 4: Server-Side Code (0% → May need mocking)
1. **server/services/** - Llama integration
2. **server/config.ts** - Server configuration
3. **server/ServiceRegistry.ts** - Service registry
4. **services/api-service.ts** - API service layer

## Testing Approach

### For Utility Functions
- Use `jest.mock()` for external dependencies
- Test happy paths, error cases, edge cases
- Validate input/output contracts

### For Hooks
- Use `@testing-library/react` hooks testing
- Mock WebSocket, API calls
- Test state updates and side effects

### For Components
- Already 90%+ done; focus on missing edge cases
- Test error boundaries, loading states
- Test user interactions

### For Server Code
- Use Node.js test environment if needed
- Mock external services (Ollama, filesystem)
- Test integration paths

## Files to Create Tests For
- [ ] lib/validators.test.ts
- [ ] lib/auth.test.ts
- [ ] lib/constants.test.ts
- [ ] utils/api-client.test.ts
- [ ] hooks/use-api.test.ts
- [ ] hooks/use-websocket.test.ts
- [ ] hooks/useLlamaStatus.test.ts
- [ ] hooks/useSystemMetrics.test.ts
- [ ] hooks/useSettings.test.ts
- [ ] components/pages/*.test.tsx
- [ ] components/dashboard/ModernDashboard.test.tsx
- [ ] components/layout/*.test.tsx (fix existing)
- [ ] services/api-service.test.ts
- [ ] server/services/*.test.ts
