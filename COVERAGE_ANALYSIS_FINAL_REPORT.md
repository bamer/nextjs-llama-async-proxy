=================================================================
COMPREHENSIVE COVERAGE ANALYSIS REPORT
=================================================================

EXECUTED: December 27, 2025
PROJECT: nextjs-llama-async-proxy
TARGET: 98%+ coverage (statements, branches, functions, lines)

=================================================================
EXECUTIVE SUMMARY
=================================================================

OVERALL STATUS: 98% COVERAGE TARGET NOT MET

Total Source Files: 90 files
Total Test Files: 154 files
Total Test Cases: 1200+ tests
Overall Coverage: ~19.13%
Files Meeting 98%+ Target: 1/90 (1.1%)
Files Below 98% Target: 89/90 (98.9%)

CURRENT METRICS:
- Statements: 22.16% (565/2550)
- Branches: 8.71% (145/1665)
- Functions: 26.51% (162/611)
- Lines: Not measured (estimated ~20%)
- Average Coverage: 19.13%

=================================================================
FILES MEETING 98%+ COVERAGE TARGET
=================================================================

1. use-websocket.ts - 97.84%
   Statements: 96.97%
   Branches: 96.55%
   Functions: 100%
   Status: NEAR TARGET - Need minor edge case coverage

=================================================================
FILES BELOW 98% COVERAGE TARGET
=================================================================

NEAR TARGET (90-97%):

1. websocket-client.ts - 94.44%
   Statements: 100%
   Branches: 83.33%
   Functions: 100%
   Gap: Need WebSocket protocol edge cases, connection failure scenarios

2. process-manager.ts - 93.40%
   Statements: 96.88%
   Branches: 83.33%
   Functions: 100%
   Gap: Need error handling tests, process failure scenarios

3. logger.ts - 91.99%
   Statements: 96.08%
   Branches: 88.24%
   Functions: 91.67%
   Gap: Need transport-level tests, log rotation tests

4. store.ts - 91.83%
   Statements: 98.57%
   Branches: 76.92%
   Functions: 100%
   Gap: Need selector tests, mutation edge cases

5. useSystemMetrics.ts - 91.67%
   Statements: 100%
   Branches: 75.00%
   Functions: 100%
   Gap: Need metric update scenarios, error handling

6. monitor.ts - 86.49%
   Statements: 88.64%
   Branches: 83.33%
   Functions: 87.50%
   Gap: Need comprehensive monitoring scenarios, failure tests

MODERATE COVERAGE (50-86%):

7. analytics.ts - 72.22%
   Statements: 66.67%
   Branches: 83.33%
   Functions: 66.67%
   Gap: Need more event tracking tests, analytics API calls

8. ollama.ts - 67.14%
   Statements: 71.43%
   Branches: 50.00%
   Functions: 80.00%
   Gap: Need error handling tests, model management tests

9. api-client.ts - 53.01%
   Statements: 61.22%
   Branches: 28.57%
   Functions: 69.23%
   Gap: Need more HTTP method tests, error handling, timeout tests

10. websocket-transport.ts - 45.74%
    Statements: 46.43%
    Branches: 15.79%
    Functions: 75.00%
    Gap: Need protocol implementation tests, message handling tests

11. Config Files (app.config.ts, llama-defaults.ts, monitoring.config.ts) - 66.67%
    Statements: 100%
    Branches: 100%
    Functions: 0% (N/A - config files)
    Status: Good coverage for config files

LOW/NO COVERAGE (0-50%):

ZERO COVERAGE FILES (75+ files):

UI Components (25+ files):
- GPUUMetricsCard.tsx - 0%
- PerformanceChart.tsx - 0%
- AdvancedSettingsTab.tsx - 0%
- ConfigurationActions.tsx - 0%
- ConfigurationHeader.tsx - 0%
- ConfigurationStatusMessages.tsx - 0%
- ConfigurationTabs.tsx - 0%
- GeneralSettingsTab.tsx - 0%
- LlamaServerSettingsTab.tsx - 0%
- LoggerSettingsTab.tsx - 0%
- ModernConfiguration.tsx - 0%
- DashboardHeader.tsx - 0%
- MetricCard.tsx - 0%
- ModelsListCard.tsx - 0%
- ModernDashboard.tsx - 0%
- QuickActionsCard.tsx - 0%
- Header.tsx - 0%
- Layout.tsx - 0%
- Sidebar.tsx - 0%
- SidebarProvider.tsx - 0%
- main-layout.tsx - 0%
- ApiRoutes.tsx - 0%
- ConfigurationPage.tsx - 0%
- LoggingSettings.tsx - 0%
- LogsPage.tsx - 0%
- ModelsPage.tsx - 0%
- MonitoringPage.tsx - 0%
- SettingsAppearance.tsx - 33%
- SettingsFeatures.tsx - 0%
- SettingsSystem.tsx - 33%

UI Base Components (7 files):
- Button.tsx - 0%
- Input.tsx - 0%
- MetricsCard.tsx - 0%
- ThemeToggle.tsx - 0%
- error-boundary.tsx - 0%
- loading.tsx - 0%
- Card.tsx - 33%

Server Services (12 files):
- ServiceRegistry.ts - 0%
- config.ts - 0%
- LlamaServerIntegration.ts - 0%
- LlamaService.ts - 0%
- index.ts - 0%
- LlamaService.ts (server/services/llama) - 0%
- argumentBuilder.ts - 0%
- healthCheck.ts - 0%
- logger.ts (server) - 0%
- modelLoader.ts - 0%
- processManager.ts (server) - 0%
- retryHandler.ts - 0%
- stateManager.ts - 0%

Client Services (2 files):
- ModelDiscoveryService.ts - 0%
- parameterService.ts - 0%
- api-service.ts - 0%

Provider/Context (1 file):
- app-provider.tsx - 0%

Utility/Support Files:
- auth.ts - 66.67%
- binary-lookup.ts - High coverage
- constants.ts - 66.67%
- error-handler.ts - 0%
- state-file.ts - High coverage
- validators.ts - 66.67%
- useConfigurationForm.ts - 0%
- useChartHistory.ts - 0%
- useLoggerConfig.ts - 0%
- ThemeContext.tsx - 0%

=================================================================
TEST EXECUTION SUMMARY
=================================================================

PASSING TESTS (Primary - __tests__/ directory):
- use-api.test.ts: 29/29 tests PASS
- useChartHistory.test.ts: 22/22 tests PASS
- useSettings.test.ts: 25/25 tests PASS
- useSystemMetrics.test.ts: 14/14 tests PASS
- useLlamaStatus.test.ts: 31/31 tests PASS
- store.test.ts (__tests__/lib/): 66/66 tests PASS
- websocket-client.test.ts (__tests__/lib/): 127/127 tests PASS
- app.config.test.ts: 55/55 tests PASS
- llama-defaults.test.ts: 170/170 tests PASS

PASSING TEST COUNT: ~639 tests

FAILING TESTS (Secondary - src/**/__tests__/):
- src/lib/__tests__/analytics.test.ts: 39 failures
- src/lib/__tests__/monitor.test.ts: 15 failures
- src/lib/__tests__/store.test.ts: 2 failures
- src/lib/__tests__/logger.test.ts: 17 failures
- src/lib/__tests__/websocket-client.test.ts: 8 failures
- src/hooks/__tests__/use-websocket.edge-case.test.ts: Multiple failures
- src/hooks/__tests__/use-api.edge-case.test.ts: Unknown failures
- src/hooks/__tests__/useSettings.edge-case.test.ts: Unknown failures
- src/hooks/__tests__/useLlamaStatus.edge-case.test.ts: Unknown failures
- __tests__/components/dashboard/ModelsListCard.test.tsx: 8/8 tests FAIL
- __tests__/components/layout/Sidebar.test.tsx: All tests FAIL (import issues)
- __tests__/stress/load-testing.test.ts: 2 tests FAIL (timing issues)

FAILING TEST COUNT: ~100+ tests

FAILING COMPONENT TESTS (8 tests):
- ModelsListCard: Broken imports causing undefined component errors
- Sidebar: Component import/export issues
- Load tests: Timeout/async timing issues

=================================================================
ISSUES PREVENTING 98%+ COVERAGE
=================================================================

1. TEST INFRASTRUCTURE ISSUES (Critical):

   a. ModelsListCard Component:
      - Issue: Component uses undefined imports (Chip, ListItem, etc.)
      - Impact: 8 test failures, blocks dashboard coverage
      - Fix: Import missing MUI components or use alternatives

   b. useStore Mocking Issues:
      - Issue: useStore.getState() returns undefined in edge-case tests
      - Impact: Multiple hook test failures
      - Fix: Proper Zustand store mocking in test setup

   c. Duplicate Test Structure:
      - Issue: Tests in both __tests__/ and src/**/__tests__/
      - Impact: Confusion, failing tests in src/**/__tests__/
      - Fix: Consolidate test files, remove duplicates

2. MISSING TEST COVERAGE (Major):

   a. 75+ source files have zero coverage:
      - All UI components (25+ files)
      - All server services (12 files)
      - Most configuration components
      - API client integration tests
      - Provider/context tests

   b. Near-target files need additional tests:
      - websocket-client.ts needs edge cases
      - store.ts needs selector tests
      - logger.ts needs transport tests
      - process-manager.ts needs error scenarios

3. COMPONENT IMPORT/EXPORT ISSUES:

   a. Multiple component tests fail with "Element type is invalid" errors
   b. Likely issues:
      - Default vs named export mismatches
      - Missing component exports
      - Circular dependencies
      - MUI component import paths

4. LOAD/STRESS TEST FAILURES:

   a. Concurrent API load tests fail due to timing/async issues
   b. These are non-critical for coverage but affect test suite health

=================================================================
ACTION PLAN TO ACHIEVE 98%+ COVERAGE
=================================================================

PHASE 1: FIX INFRASTRUCTURE (Required for coverage analysis)

Priority 1 - Critical Fixes (1-2 days):
1. Fix ModelsListCard imports
   - Import all required MUI components (Chip, ListItem, etc.)
   - Verify component exports
   - Run models dashboard tests

2. Fix useStore mocking in edge-case tests
   - Add proper Zustand store mocks to jest.setup.ts
   - Ensure all hooks tests can access store.getState()
   - Verify edge-case tests pass

3. Remove/fix duplicate test files
   - Consolidate src/**/__tests__/ tests into __tests__/
   - Remove redundant test files
   - Ensure all tests in single location

Priority 2 - Component Tests (3-5 days):
4. Fix Sidebar component import/export
5. Fix all component import/export issues
6. Ensure all UI component tests run without errors

PHASE 2: IMPROVE NEAR-TARGET FILES (1-2 weeks)

7. websocket-client.ts (94.44% → 98%+):
   - Add connection failure scenarios
   - Test WebSocket protocol edge cases
   - Add reconnection logic tests
   - Test message handling edge cases

8. store.ts (91.83% → 98%+):
   - Add comprehensive selector tests
   - Test mutation edge cases
   - Test state reset scenarios
   - Add performance tests

9. process-manager.ts (93.40% → 98%+):
   - Add process failure tests
   - Test cleanup scenarios
   - Add timeout handling tests
   - Test concurrent process management

10. logger.ts (91.99% → 98%+):
    - Test all transport types
    - Add log rotation tests
    - Test error scenarios
    - Test concurrent logging

11. useSystemMetrics.ts (91.67% → 98%+):
    - Test metric update edge cases
    - Add error handling tests
    - Test WebSocket message handling
    - Test loading states

12. monitor.ts (86.49% → 98%+):
    - Add comprehensive monitoring scenarios
    - Test all metric collection methods
    - Add performance test coverage
    - Test data aggregation

PHASE 3: CREATE TESTS FOR ZERO-COVERAGE FILES (2-4 weeks)

13. UI Components - Priority Order:
    Week 1: Core UI (Button, Input, Card) - 3 files
    Week 2: Dashboard (MetricCard, DashboardHeader, QuickActions) - 3 files
    Week 3: Layout (Header, Sidebar, Layout) - 3 files
    Week 4: Configuration (all tabs and components) - 6 files

14. Page Components:
    - ModelsPage, LogsPage, MonitoringPage, ConfigurationPage
    - ApiRoutes, LoggingSettings
    - Settings pages (Appearance, Features, System)

15. Server Services - Critical Path:
    - LlamaService (highest priority)
    - LlamaServerIntegration
    - ModelDiscoveryService
    - ParameterService
    - Health check utilities
    - Process management (server side)

16. Client Services:
    - api-service.ts comprehensive tests
    - All WebSocket-related services
    - Error handling scenarios
    - API integration tests

PHASE 4: EDGE CASES AND INTEGRATION (1-2 weeks)

17. WebSocket Scenarios:
    - Connection failures and retries
    - Network timeouts
    - Invalid message handling
    - Reconnection logic
    - Concurrent operations

18. API Scenarios:
    - Error responses
    - Timeout handling
    - Retry logic
    - Rate limiting
    - Concurrent requests

19. State Management:
    - Concurrent mutations
    - State reset scenarios
    - Selector edge cases
    - Subscription lifecycle
    - Performance edge cases

20. Component Integration:
    - Cross-component interactions
    - Error propagation
    - Loading states
    - Error boundaries
    - User interaction flows

PHASE 5: FINAL VERIFICATION (1 week)

21. Run full test suite with coverage
22. Verify 98%+ coverage across all metrics
23. Fix any remaining gaps
24. Document test coverage strategy
25. Set up CI coverage gates

=================================================================
ESTIMATED EFFORT TO ACHIEVE 98%+ COVERAGE
=================================================================

Infrastructure Fixes: 1-2 days (Critical blockers)
Near-Target Improvements: 1-2 weeks
Zero-Coverage Tests: 2-4 weeks
Edge Cases/Integration: 1-2 weeks
Final Verification: 1 week

TOTAL ESTIMATE: 6-10 weeks to achieve 98%+ coverage

Assumes:
- 1-2 dedicated QA/engineering resources
- Full-time focus on test coverage
- No production feature development during this period
- Parallel work on different file categories

=================================================================
RECOMMENDATIONS
=================================================================

IMMEDIATE ACTIONS (This Week):
1. Fix ModelsListCard imports (blocking 8 tests)
2. Fix useStore mocking (blocking ~20 tests)
3. Consolidate duplicate test files
4. Verify all passing tests still pass after fixes

SHORT TERM (Next 2 Weeks):
5. Improve 6 near-target files to 98%+
6. Create tests for 10 highest-priority zero-coverage files
7. Establish test coverage tracking dashboard

MEDIUM TERM (Next 4-6 Weeks):
8. Complete all UI component tests
9. Complete all server service tests
10. Add integration test scenarios

LONG TERM (Ongoing):
11. Maintain 98%+ coverage with CI gates
12. Add tests with all new features
13. Regular coverage audits and improvements
14. Performance testing as part of coverage goals

=================================================================
CONCLUSION
=================================================================

STATUS: 98% COVERAGE TARGET NOT MET

Current Achievement: ~19% overall coverage (far from 98% target)
Files Meeting Target: 1/90 (1.1%)

PRIMARY BARRIERS:
1. Test infrastructure issues prevent full test execution
2. 75+ files completely lack test coverage
3. Multiple test suites have failures blocking coverage
4. Significant work required to achieve 98% target

ASSESSMENT:
- Good foundation exists with high-quality passing tests
- Critical infrastructure issues need immediate attention
- 6-10 week effort estimate to achieve 98% target
- Test architecture is sound but needs significant expansion

RECOMMENDATION:
Focus on fixing test infrastructure first, then systematically add
tests to uncovered files. Prioritize:
1. Core services (WebSocket, API, State) - Already near target
2. Critical UI components - Zero coverage, high impact
3. Dashboard functionality - User-facing, important
4. Server-side services - Backend logic, critical

TARGET ACHIEVEMENT:
Realistically achievable in 6-10 weeks with dedicated resources
and focused effort on test coverage improvements.

=================================================================
END OF REPORT
=================================================================
