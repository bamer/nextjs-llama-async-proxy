# Coverage Action Plan: 9% → 98%

## Current Status
- **Tests Created**: 24 (validators + baseline tests)
- **Current Coverage**: 11.55%
- **Gap**: 86.45 percentage points
- **Source Files**: 96 total

## Priority Tiers (Effort vs. Impact)

### TIER 1: QUICK WINS (Low effort, high impact)
These are configuration and utility files that are trivial to test.

**Files** (should add ~5-10% coverage):
- [ ] `config/app.config.ts` - Validate constants
- [ ] `config/llama-defaults.ts` - Validate defaults
- [ ] `config/monitoring.config.ts` - Validate config object
- [ ] `lib/constants.ts` - Test exported constants
- [ ] `lib/auth.ts` - Test JWT/auth utility

**Test Template**:
```typescript
describe("Module", () => {
  it("exports expected values", () => {
    // Import and validate
  });
});
```

### TIER 2: MEDIUM EFFORT (Components - partially tested)
These already have some tests but need edge cases and full coverage.

**Files** (should add ~10-15% coverage):
- [ ] `components/layout/*` - Fix existing tests, add missing ones
- [ ] `components/pages/ConfigurationPage.tsx` (52% → 100%)
- [ ] `components/pages/ApiRoutes.tsx` (76% → 100%)
- [ ] `components/dashboard/ModernDashboard.tsx` (0% → 100%)
- [ ] `components/ui/Button.tsx` (0% → 100%)
- [ ] `components/ui/Input.tsx` (0% → 100%)
- [ ] `components/ui/error-boundary.tsx` (0% → 100%)

### TIER 3: HOOKS (Medium effort, high complexity)
Requires mocking of WebSocket, React Query, etc.

**Files** (should add ~15-20% coverage):
- [ ] `hooks/use-api.ts` - React Query wrapper
- [ ] `hooks/useSettings.ts` - Settings management
- [ ] `hooks/useSystemMetrics.ts` - System data
- [ ] `hooks/useLlamaStatus.ts` - Llama status
- [ ] `hooks/useChartHistory.ts` - Chart data
- [ ] `hooks/use-logger-config.ts` - Logger config
- [ ] `hooks/use-websocket.ts` - WebSocket (complex)
- [ ] `components/dashboard/hooks/useDashboardMetrics.ts`
- [ ] `components/configuration/hooks/useConfigurationForm.ts`

### TIER 4: SERVICES & UTILS (Medium effort)
API services and utility layers.

**Files** (should add ~15-20% coverage):
- [ ] `services/api-service.ts` - API wrapper methods
- [ ] `lib/logger.ts` - Logging service
- [ ] `lib/store.ts` - Zustand store
- [ ] `lib/error-handler.ts` - Error handling
- [ ] `lib/monitor.ts` - Monitoring utility
- [ ] `lib/websocket-client.ts` - WebSocket client
- [ ] `utils/api-client.ts` - (Fix mocking issues)

### TIER 5: SERVER-SIDE CODE (Complex, requires Node env)
Server-side code - may need separate test environment.

**Files** (should add ~20-25% coverage):
- [ ] `server/services/LlamaService.ts` - Llama integration
- [ ] `server/config.ts` - Server configuration
- [ ] `server/ServiceRegistry.ts` - Service registry
- [ ] `lib/services/ModelDiscoveryService.ts`
- [ ] `lib/services/parameterService.ts`

### TIER 6: REMAINING PAGES (High volume)
Page components not yet tested.

**Files** (should add ~10-15% coverage):
- [ ] `components/pages/LoggingSettings.tsx`
- [ ] `components/pages/LogsPage.tsx`
- [ ] `components/pages/ModelsPage.tsx`
- [ ] `components/pages/MonitoringPage.tsx`
- [ ] `components/pages/settings/*.tsx`

## Recommended Execution Order

1. **Start with TIER 1** (configs/constants) - 30 mins, ~6% coverage
2. **Fix TIER 2 layouts** - 1 hour, ~10% coverage  
3. **Complete TIER 2 pages** - 2 hours, ~15% coverage
4. **TIER 3 hooks (start with simple ones)** - 3 hours, ~20% coverage
5. **TIER 4 services** - 2 hours, ~18% coverage
6. **TIER 6 page components** - 4 hours, ~12% coverage
7. **TIER 5 server code** - 3 hours (optional, complex)

**Total Time Estimate**: 15-20 hours for ~98% coverage

## Testing Infrastructure Notes

### Jest Config
- ✅ jsdom environment for React tests
- ✅ 70% threshold (need to increase to 98%)
- ⚠️ Module resolution with `@/` aliases works
- ⚠️ Mock `axios` before importing api-client

### Mocking Strategy
- **External APIs**: Mock axios/fetch entirely
- **React Query**: Mock `@tanstack/react-query` 
- **WebSocket**: Mock with event listeners
- **Zustand**: Mock store selectors
- **Next.js**: Mock next/navigation, next/image

### Test File Location
All tests in `__tests__/` matching source structure:
- `src/hooks/useApi.ts` → `__tests__/hooks/useApi.test.ts`
- `src/services/api-service.ts` → `__tests__/services/api-service.test.ts`

## What to Do Next

Option A (Recommended): Start with TIER 1
```bash
# Create simple config tests
pnpm test:coverage  # Check ~17% coverage
```

Option B: Automated Test Generation
Use a script to generate test stubs for all uncovered files, then incrementally fill them in.

Option C: Focus on High-Value Areas
Skip server code, focus on client-side components and hooks (reach ~85% without server tests).
