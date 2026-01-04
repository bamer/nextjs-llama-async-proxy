# Coverage Improvement Action Checklist

## Phase 1: Fix Existing Tests (CRITICAL - MUST DO FIRST)

### 1.1 Fix Syntax Error
- [ ] Fix unclosed block in `__tests__/hooks/useConfigurationForm.test.ts` line 1422
- [ ] Run: `pnpm test __tests__/hooks/useConfigurationForm.test.ts`

### 1.2 Fix localStorage Persistence Tests
- [ ] Investigate why localStorage.setItem not persisting in `__tests__/lib/store.edge-cases.test.ts`
- [ ] Check Zustand store configuration
- [ ] Add proper localStorage mock if needed
- [ ] Fix 9 failing persistence tests:
  - [ ] should handle rapid state changes
  - [ ] should handle clearing error and setting loading
  - [ ] should persist models correctly
  - [ ] should persist activeModelId correctly
  - [ ] should persist settings correctly
  - [ ] should persist chartHistory correctly
  - [ ] should not persist metrics
  - [ ] should not persist logs
  - [ ] should not persist status

### 1.3 Fix Database Cascade Delete Tests
- [ ] Fix foreign key constraints in `__tests__/lib/database-normalized.test.ts`
- [ ] Fix 8 failing tests:
  - [ ] should cascade delete memory config on model delete
  - [ ] should return null for non-existent memory config
  - [ ] should handle unlimited cache_ram (-1)
  - [ ] should save GPU configuration with modelId parameter
  - [ ] should get GPU configuration
  - [ ] should cascade delete GPU config on model delete
  - [ ] should return null for non-existent GPU config
  - [ ] should handle auto GPU layers (-1)
  - [ ] (and more)

### 1.4 Fix Winston Mock
- [ ] Add Winston mock to jest.setup.ts
- [ ] Fix DailyRotateFile initialization error in monitor.test.ts
- [ ] Run: `pnpm test __tests__/lib/monitor.test.ts`

---

## Phase 2: Quick Wins (9 files, ~105 minutes)

### 2.1 App Pages
- [ ] Test `app/not-found.tsx`
  - [ ] displays 404 message
  - [ ] provides link to home
  - [ ] **Effort: 5 minutes**

- [ ] Test `app/settings/page.tsx`
  - [ ] renders settings form
  - [ ] saves configuration
  - [ ] loads existing settings
  - [ ] **Effort: 10 minutes**

- [ ] Test `app/dashboard/page.tsx`
  - [ ] renders dashboard components
  - [ ] loads metrics
  - [ ] displays model information
  - [ ] **Effort: 10 minutes**

- [ ] Test `app/page.tsx`
  - [ ] renders welcome message
  - [ ] navigation links work
  - [ ] displays dashboard info
  - [ ] **Effort: 15 minutes**

- [ ] Test `app/layout.tsx`
  - [ ] renders correctly
  - [ ] applies theme provider
  - [ ] includes proper metadata
  - [ ] handles children rendering
  - [ ] **Effort: 20 minutes**

### 2.2 Core Components
- [ ] Test `src/components/configuration/ModernConfiguration.tsx`
  - [ ] renders configuration UI
  - [ ] loads existing config
  - [ ] updates config
  - [ ] handles validation errors
  - [ ] **Effort: 15 minutes**

### 2.3 Services/Utilities
- [ ] Test `src/server/model-templates.ts`
  - [ ] returns template data
  - [ ] handles missing templates
  - [ ] **Effort: 5 minutes**

- [ ] Test `src/workers/template-processor.worker.ts`
  - [ ] processes templates
  - [ ] handles errors
  - [ ] returns processed data
  - [ ] **Effort: 10 minutes**

- [ ] Test `src/lib/workers-manager.ts`
  - [ ] creates workers
  - [ ] terminates workers
  - [ ] handles worker messages
  - [ ] cleans up on unmount
  - [ ] **Effort: 15 minutes**

**Phase 2 Total: 9 files, ~105 minutes**

---

## Phase 3: High Impact Files (7 files, ~4 hours)

### 3.1 API Routes
- [ ] Test `app/api/models/[name]/start/route.ts`
  - [ ] starts model successfully
  - [ ] handles missing model
  - [ ] handles already running model
  - [ ] validates request
  - [ ] returns proper error responses
  - [ ] **Effort: 30 minutes**

### 3.2 Core Services
- [ ] Improve `src/server/services/llama/LlamaService.ts` from 17.2% to 50%
  - [ ] test initialization
  - [ ] test model loading
  - [ ] test connection management
  - [ ] test error handling
  - [ ] test resource cleanup
  - [ ] **Effort: 30 minutes**

- [ ] Improve `src/server/services/LlamaService.ts` from 68% to 90%
  - [ ] test API call wrapping
  - [ ] test state management
  - [ ] test error recovery
  - [ ] **Effort: 30 minutes**

### 3.3 React Components
- [ ] Test `src/contexts/ThemeContext.tsx`
  - [ ] provides default theme
  - [ ] toggles theme mode
  - [ ] persists theme to localStorage
  - [ ] handles system preference
  - [ ] **Effort: 15 minutes**

- [ ] Test `app/logs/page.tsx`
  - [ ] fetches and displays logs
  - [ ] filters logs by level
  - [ ] handles empty log state
  - [ ] refreshes logs
  - [ ] **Effort: 30 minutes**

- [ ] Test `app/monitoring/page.tsx`
  - [ ] displays system metrics
  - [ ] shows real-time updates
  - [ ] renders charts
  - [ ] handles loading state
  - [ ] **Effort: 25 minutes**

### 3.4 Utilities
- [ ] Improve `src/lib/websocket-client.ts` from 78% to 95%
  - [ ] test reconnection logic
  - [ ] test message validation
  - [ ] test cleanup handlers
  - [ ] **Effort: 15 minutes**

- [ ] Improve `src/utils/api-client.ts` from 68% to 95%
  - [ ] test error handling paths
  - [ ] test timeout scenarios
  - [ ] test auth header handling
  - [ ] **Effort: 15 minutes**

- [ ] Test `src/components/pages/LoggingSettings.tsx`
  - [ ] renders logging controls
  - [ ] changes log levels
  - [ ] updates log format
  - [ ] handles file logging toggle
  - [ ] **Effort: 25 minutes**

**Phase 3 Total: 7 files, ~4 hours**

---

## Phase 4: Medium Priority Files (5 files, ~4 hours)

- [ ] Improve `app/models/page.tsx` from 23% to 50%
  - [ ] **Effort: 30 minutes**

- [ ] Test `src/components/ui/ModelConfigDialogImproved.tsx`
  - [ ] renders form fields
  - [ ] validates inputs
  - [ ] saves configuration
  - [ ] cancels changes
  - [ ] handles edge cases
  - [ ] **Effort: 45 minutes**

- [ ] Test `src/components/pages/LoggingSettings.tsx`
  - [ ] **Effort: 25 minutes**

- [ ] Improve `src/server/services/LlamaServerIntegration.ts` from 35% to 50%
  - [ ] **Effort: 45 minutes**

- [ ] Test `src/components/ui/ModelConfigDialog.tsx`
  - [ ] **Effort: 30 minutes**

- [ ] Test `src/components/configuration/LoggerSettingsTab.tsx`
  - [ ] **Effort: 20 minutes**

- [ ] Test `src/components/pages/MonitoringPage.tsx`
  - [ ] **Effort: 30 minutes**

- [ ] Test `src/components/ui/MultiSelect.tsx`
  - [ ] **Effort: 20 minutes**

**Phase 4 Total: ~4 hours**

---

## Phase 5: Quick Improvements (37 files, ~4 hours)

### 5.1 Near-Target Files (90-98%)
- [ ] `src/components/layout/Header.tsx` - 90.9% (1 statement)
- [ ] `src/hooks/use-logger-config.ts` - 93.5% (2 statements)
- [ ] `src/components/pages/ModelsPage.tsx` - 94.3% (5 statements)
- [ ] `src/server/services/llama/processManager.ts` - 94.4% (2 statements)
- [ ] `src/components/layout/Sidebar.tsx` - 95.0% (1 statement)
- [ ] `src/components/dashboard/DashboardHeader.tsx` - 95.2% (1 statement)
- [ ] `src/server/services/llama/healthCheck.ts` - 95.2% (1 statement)
- [ ] `src/components/pages/LogsPage.tsx` - 96.2% (2 statements)
- [ ] `src/components/dashboard/CircularGauge.tsx` - 96.7% (1 statement)
- [ ] `src/server/services/llama/modelLoader.ts` - 96.9% (1 statement)
- [ ] `src/components/dashboard/MetricCard.tsx` - 97.6% (1 statement)
- [ ] `src/server/services/fit-params-service.ts` - 98.0% (2 statements)

### 5.2 70-90% Coverage Files
- [ ] `src/lib/store.ts` - 81.2% (19 statements)
- [ ] `src/components/dashboard/ModelsListCard.tsx` - 80.0% (10 statements)
- [ ] `src/components/ui/ThemeToggle.tsx` - 83.3% (5 statements)
- [ ] `app/api/models/[name]/analyze/route.ts` - 85.7% (6 statements)
- [ ] `src/lib/monitor.ts` - 89.1% (5 statements)
- [ ] `src/providers/websocket-provider.tsx` - 90.6% (16 statements)

### 5.3 60-80% Coverage Files
- [ ] `src/lib/database.ts` - 88.7% (38 statements)
- [ ] `src/components/configuration/hooks/useConfigurationForm.ts` - 88.8% (10 statements)
- [ ] `app/api/model-templates/route.ts` - 72.1% (12 statements)
- [ ] `src/components/ui/error-boundary.tsx` - 61.9% (24 statements)
- [ ] `src/components/dashboard/ModernDashboard.tsx` - 65.2% (31 statements)
- [ ] `src/hooks/useChartHistory.ts` - 51.8% (27 statements)
- [ ] `src/components/ui/error-fallbacks.tsx` - 53.1% (15 statements)
- [ ] `src/components/models/ModelConfigDialog.tsx` - 57.6% (84 statements)
- [ ] `src/lib/server-config.ts` - 57.8% (27 statements)
- [ ] `app/api/models/[name]/stop/route.ts` - 59.1% (9 statements)
- [ ] `src/components/pages/ConfigurationPage.tsx` - 69.0% (13 statements)
- [ ] `src/hooks/use-api.ts` - 69.2% (4 statements)
- [ ] `src/utils/request-idle-callback.ts` - 71.1% (24 statements)
- [ ] `src/lib/validators.ts` - 74.4% (21 statements)
- [ ] `src/lib/analytics.ts` - 78.3% (13 statements)
- [ ] `src/components/dashboard/GPUMetricsSection.tsx` - 78.6% (3 statements)

**Phase 5 Total: 37 files, ~4 hours**

---

## Progress Tracking

### Coverage Metrics Before: After Each Phase

| Phase | Statements | Branches | Functions | Time |
|-------|-----------|----------|-----------|------|
| **Current** | 67.58% | 56.84% | 58.70% | - |
| After Phase 1 | +5% | +3% | +4% | 2-3 hrs |
| After Phase 2 | +8% | +5% | +6% | +2 hrs |
| After Phase 3 | +12% | +8% | +10% | +4 hrs |
| After Phase 4 | +6% | +4% | +5% | +4 hrs |
| After Phase 5 | +15% | +10% | +12% | +4 hrs |
| **Target** | **98%** | **98%** | **98%** | **14-16 hrs** |

### Daily Goals

**Day 1:** Complete Phase 1 + Quick Wins (4-5 hours)
- [ ] Fix all existing test failures
- [ ] Test all quick win files
- [ ] Run full coverage: `pnpm test:coverage`
- [ ] Target: 80% statements

**Day 2:** Complete Phase 3 (4 hours)
- [ ] Test high-impact files
- [ ] Run full coverage: `pnpm test:coverage`
- [ ] Target: 90% statements

**Day 3:** Complete Phase 4 (4 hours)
- [ ] Test medium-priority files
- [ ] Run full coverage: `pnpm test:coverage`
- [ ] Target: 95% statements

**Day 4:** Complete Phase 5 (4 hours)
- [ ] Test remaining files
- [ ] Run final coverage: `pnpm test:coverage`
- [ ] Verify 98% target achieved ✅

---

## Commands Reference

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test __tests__/hooks/useConfigurationForm.test.ts

# Watch mode during development
pnpm test:watch

# View coverage report
open coverage-final/lcov-report/index.html

# Check coverage for specific file
pnpm test -- --collectCoverageFrom='src/lib/store.ts'
```

---

## Notes

- Always run `pnpm type:check` before committing
- Fix linting errors with `pnpm lint:fix`
- Keep tests focused and simple
- Mock all external dependencies
- Test user behavior, not implementation details
- Use `act()` for state updates in tests
- Clean up mocks in `afterEach()`

---

**Last Updated:** December 30, 2025
**Total Estimated Effort:** 14-16 hours
**Current Status:** Ready to begin Phase 1
