# Coverage Gaps Analysis Report

Generated: 2025-12-27T03:41:03.081Z

## Coverage Summary

| Metric | Coverage |
|--------|----------|
| Statements | 65.23% |
| Branches | 49.59% |
| Functions | 54.15% |
| Lines | 65.23% |
| Average | 58.55% |

## Files by Coverage Level

### 100% Coverage (✅)

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| src/components/dashboard/MetricCard.tsx | 100.0% | 100.0% | 100.0% | 100.0% |
| src/components/layout/SidebarProvider.tsx | 100.0% | 100.0% | 100.0% | 100.0% |
| src/components/layout/main-layout.tsx | 100.0% | 100.0% | 100.0% | 100.0% |
| src/hooks/useLlamaStatus.ts | 100.0% | 100.0% | 100.0% | 100.0% |

### 75-99% Coverage (⚠️)

| File | Avg | Statements | Branches | Functions | Lines | Needs Coverage |
|------|-----|------------|----------|-----------|-------|----------------|
| src/components/pages/LogsPage.tsx | 99.0% | 100.0% | 97.1% | 100.0% | 100.0% | 97% branches |
| src/server/services/llama/processManager.ts | 96.4% | 94.4% | 94.7% | 100.0% | 94.4% | 94% stmts, 95% branches |
| src/lib/store.ts | 92.0% | 94.3% | 92.3% | 89.5% | 94.3% | 94% stmts, 92% branches, 89% funcs |
| src/lib/logger.ts | 92.0% | 96.1% | 88.2% | 91.7% | 96.1% | 96% stmts, 88% branches, 92% funcs |
| src/lib/monitor.ts | 86.5% | 88.6% | 83.3% | 87.5% | 88.6% | 89% stmts, 83% branches, 88% funcs |
| src/components/layout/Header.tsx | 80.3% | 90.9% | 100.0% | 50.0% | 90.9% | 91% stmts, 50% funcs |

### 50-74% Coverage (⚠️⚠️)

| File | Avg | Statements | Branches | Functions | Lines | Needs Coverage |
|------|-----|------------|----------|-----------|-------|----------------|
| src/server/services/LlamaService.ts | 69.6% | 73.1% | 59.9% | 75.8% | 73.1% | 73% stmts, 60% branches |
| src/hooks/use-api.ts | 66.7% | 100.0% | 0.0% | 100.0% | 100.0% | 0% branches |
| src/config/app.config.ts | 62.5% | 100.0% | 87.5% | 0.0% | 100.0% | 0% funcs |
| src/components/dashboard/ModelsListCard.tsx | 58.4% | 54.1% | 71.1% | 50.0% | 54.1% | 54% stmts, 71% branches, 50% funcs |
| src/contexts/ThemeContext.tsx | 55.5% | 79.1% | 47.4% | 40.0% | 79.1% | 47% branches, 40% funcs |
| src/utils/api-client.ts | 53.0% | 61.2% | 28.6% | 69.2% | 61.2% | 61% stmts, 29% branches, 69% funcs |
| src/components/dashboard/ModernDashboard.tsx | 51.6% | 69.5% | 63.2% | 22.2% | 69.5% | 69% stmts, 63% branches, 22% funcs |

### 0-49% Coverage (❌)

| File | Avg | Statements | Branches | Functions | Lines | Uncovered |
|------|-----|------------|----------|-----------|-------|-----------|
| src/components/configuration/ConfigurationActions.tsx | 25.0% | 75.0% | 0.0% | 0.0% | 75.0% | 1 stmts, 2 branches, 1 funcs |
| src/services/api-service.ts | 24.8% | 30.1% | 23.5% | 20.8% | 30.1% | 51 stmts, 52 branches, 19 funcs |
| src/components/configuration/ModernConfiguration.tsx | 24.4% | 73.3% | 0.0% | 0.0% | 73.3% | 4 stmts, 10 branches, 1 funcs |
| src/components/configuration/AdvancedSettingsTab.tsx | 23.8% | 71.4% | 0.0% | 0.0% | 71.4% | 2 stmts, 4 branches, 1 funcs |
| src/components/configuration/ConfigurationHeader.tsx | 22.2% | 66.7% | 0.0% | 0.0% | 66.7% | 2 stmts, 2 branches, 1 funcs |
| src/components/configuration/ConfigurationStatusMessages.tsx | 20.8% | 62.5% | 0.0% | 0.0% | 62.5% | 3 stmts, 8 branches, 2 funcs |
| src/components/configuration/ConfigurationTabs.tsx | 20.0% | 60.0% | 0.0% | 0.0% | 60.0% | 2 stmts, 4 branches, 1 funcs |
| src/components/configuration/LlamaServerSettingsTab.tsx | 16.7% | 50.0% | 0.0% | 0.0% | 50.0% | 4 stmts, 26 branches, 2 funcs |
| src/components/configuration/GeneralSettingsTab.tsx | 14.8% | 44.4% | 0.0% | 0.0% | 44.4% | 5 stmts, 6 branches, 4 funcs |
| src/components/configuration/LoggerSettingsTab.tsx | 9.5% | 28.6% | 0.0% | 0.0% | 28.6% | 10 stmts, 18 branches, 8 funcs |
| src/lib/websocket-client.ts | 5.8% | 13.0% | 0.0% | 4.5% | 13.0% | 47 stmts, 18 branches, 21 funcs |
| src/lib/websocket-transport.ts | 3.6% | 10.7% | 0.0% | 0.0% | 10.7% | 25 stmts, 19 branches, 8 funcs |

### 0% Coverage (🚨) - Critical

These files have NO test coverage and need immediate attention:

- **src/components/configuration/hooks/useConfigurationForm.ts**

## Coverage by Directory

| Directory | Files | Avg Coverage | Min | Max |
|-----------|-------|--------------|-----|-----|
| src/components/configuration | 9 | 19.7% | 9.5% | 25.0% |
| src/components/configuration/hooks | 1 | 0.0% | 0.0% | 0.0% |
| src/components/dashboard | 3 | 70.0% | 51.6% | 100.0% |
| src/components/layout | 3 | 93.4% | 80.3% | 100.0% |
| src/components/pages | 1 | 99.0% | 99.0% | 99.0% |
| src/config | 1 | 62.5% | 62.5% | 62.5% |
| src/contexts | 1 | 55.5% | 55.5% | 55.5% |
| src/hooks | 2 | 83.3% | 66.7% | 100.0% |
| src/lib | 5 | 56.0% | 3.6% | 92.0% |
| src/server/services | 1 | 69.6% | 69.6% | 69.6% |
| src/server/services/llama | 1 | 96.4% | 96.4% | 96.4% |
| src/services | 1 | 24.8% | 24.8% | 24.8% |
| src/utils | 1 | 53.0% | 53.0% | 53.0% |

## Specific Coverage Gaps

### Files with Uncovered Functions

**src/components/configuration/AdvancedSettingsTab.tsx**
- 1 functions uncovered (0.0% covered)

**src/components/configuration/ConfigurationActions.tsx**
- 1 functions uncovered (0.0% covered)

**src/components/configuration/ConfigurationHeader.tsx**
- 1 functions uncovered (0.0% covered)

**src/components/configuration/ConfigurationStatusMessages.tsx**
- 2 functions uncovered (0.0% covered)

**src/components/configuration/ConfigurationTabs.tsx**
- 1 functions uncovered (0.0% covered)

**src/components/configuration/GeneralSettingsTab.tsx**
- 4 functions uncovered (0.0% covered)

**src/components/configuration/LlamaServerSettingsTab.tsx**
- 2 functions uncovered (0.0% covered)

**src/components/configuration/LoggerSettingsTab.tsx**
- 8 functions uncovered (0.0% covered)

**src/components/configuration/ModernConfiguration.tsx**
- 1 functions uncovered (0.0% covered)

**src/components/configuration/hooks/useConfigurationForm.ts**
- 15 functions uncovered (0.0% covered)

**src/components/dashboard/ModelsListCard.tsx**
- 4 functions uncovered (50.0% covered)

**src/components/dashboard/ModernDashboard.tsx**
- 14 functions uncovered (22.2% covered)

**src/components/layout/Header.tsx**
- 1 functions uncovered (50.0% covered)

**src/contexts/ThemeContext.tsx**
- 6 functions uncovered (40.0% covered)

**src/lib/logger.ts**
- 1 functions uncovered (91.7% covered)

**src/lib/monitor.ts**
- 1 functions uncovered (87.5% covered)

**src/lib/store.ts**
- 4 functions uncovered (89.5% covered)

**src/lib/websocket-client.ts**
- 21 functions uncovered (4.5% covered)

**src/lib/websocket-transport.ts**
- 8 functions uncovered (0.0% covered)

**src/server/services/LlamaService.ts**
- 8 functions uncovered (75.8% covered)

**src/services/api-service.ts**
- 19 functions uncovered (20.8% covered)

**src/utils/api-client.ts**
- 4 functions uncovered (69.2% covered)

### Files with Uncovered Branches

**src/components/configuration/AdvancedSettingsTab.tsx**
- 4 branches uncovered (0.0% covered)

**src/components/configuration/ConfigurationActions.tsx**
- 2 branches uncovered (0.0% covered)

**src/components/configuration/ConfigurationHeader.tsx**
- 2 branches uncovered (0.0% covered)

**src/components/configuration/ConfigurationStatusMessages.tsx**
- 8 branches uncovered (0.0% covered)

**src/components/configuration/ConfigurationTabs.tsx**
- 4 branches uncovered (0.0% covered)

**src/components/configuration/GeneralSettingsTab.tsx**
- 6 branches uncovered (0.0% covered)

**src/components/configuration/LlamaServerSettingsTab.tsx**
- 26 branches uncovered (0.0% covered)

**src/components/configuration/LoggerSettingsTab.tsx**
- 18 branches uncovered (0.0% covered)

**src/components/configuration/ModernConfiguration.tsx**
- 10 branches uncovered (0.0% covered)

**src/components/configuration/hooks/useConfigurationForm.ts**
- 55 branches uncovered (0.0% covered)

**src/components/dashboard/ModelsListCard.tsx**
- 13 branches uncovered (71.1% covered)

**src/components/dashboard/ModernDashboard.tsx**
- 14 branches uncovered (63.2% covered)

**src/components/pages/LogsPage.tsx**
- 1 branches uncovered (97.1% covered)

**src/config/app.config.ts**
- 1 branches uncovered (87.5% covered)

**src/contexts/ThemeContext.tsx**
- 10 branches uncovered (47.4% covered)

**src/lib/logger.ts**
- 2 branches uncovered (88.2% covered)

**src/lib/monitor.ts**
- 1 branches uncovered (83.3% covered)

**src/lib/store.ts**
- 1 branches uncovered (92.3% covered)

**src/lib/websocket-client.ts**
- 18 branches uncovered (0.0% covered)

**src/lib/websocket-transport.ts**
- 19 branches uncovered (0.0% covered)

**src/server/services/LlamaService.ts**
- 91 branches uncovered (59.9% covered)

**src/server/services/llama/processManager.ts**
- 1 branches uncovered (94.7% covered)

**src/services/api-service.ts**
- 52 branches uncovered (23.5% covered)

**src/utils/api-client.ts**
- 10 branches uncovered (28.6% covered)

### Files with Uncovered Statements

**src/components/configuration/AdvancedSettingsTab.tsx**
- 2 statements uncovered (71.4% covered)

**src/components/configuration/ConfigurationActions.tsx**
- 1 statements uncovered (75.0% covered)

**src/components/configuration/ConfigurationHeader.tsx**
- 2 statements uncovered (66.7% covered)

**src/components/configuration/ConfigurationStatusMessages.tsx**
- 3 statements uncovered (62.5% covered)

**src/components/configuration/ConfigurationTabs.tsx**
- 2 statements uncovered (60.0% covered)

**src/components/configuration/GeneralSettingsTab.tsx**
- 5 statements uncovered (44.4% covered)

**src/components/configuration/LlamaServerSettingsTab.tsx**
- 4 statements uncovered (50.0% covered)

**src/components/configuration/LoggerSettingsTab.tsx**
- 10 statements uncovered (28.6% covered)

**src/components/configuration/ModernConfiguration.tsx**
- 4 statements uncovered (73.3% covered)

**src/components/configuration/hooks/useConfigurationForm.ts**
- 75 statements uncovered (0.0% covered)

**src/components/dashboard/ModelsListCard.tsx**
- 17 statements uncovered (54.1% covered)

**src/components/dashboard/ModernDashboard.tsx**
- 18 statements uncovered (69.5% covered)

**src/components/layout/Header.tsx**
- 1 statements uncovered (90.9% covered)

**src/contexts/ThemeContext.tsx**
- 9 statements uncovered (79.1% covered)

**src/lib/logger.ts**
- 2 statements uncovered (96.1% covered)

**src/lib/monitor.ts**
- 5 statements uncovered (88.6% covered)

**src/lib/store.ts**
- 4 statements uncovered (94.3% covered)

**src/lib/websocket-client.ts**
- 47 statements uncovered (13.0% covered)

**src/lib/websocket-transport.ts**
- 25 statements uncovered (10.7% covered)

**src/server/services/LlamaService.ts**
- 78 statements uncovered (73.1% covered)

**src/server/services/llama/processManager.ts**
- 2 statements uncovered (94.4% covered)

**src/services/api-service.ts**
- 51 statements uncovered (30.1% covered)

**src/utils/api-client.ts**
- 19 statements uncovered (61.2% covered)

## Recommendations

### Priority 1: Files with 0% Coverage (🚨)

- [ ] **src/components/configuration/hooks/useConfigurationForm.ts** - Create initial test suite

### Priority 2: Files with <50% Coverage (❌)

- [ ] **src/components/configuration/ConfigurationActions.tsx** (25.0% avg) - Expand test coverage
  - Add tests for 1 uncovered functions
  - Add tests for 2 uncovered branches
- [ ] **src/services/api-service.ts** (24.8% avg) - Expand test coverage
  - Add tests for 19 uncovered functions
  - Add tests for 52 uncovered branches
- [ ] **src/components/configuration/ModernConfiguration.tsx** (24.4% avg) - Expand test coverage
  - Add tests for 1 uncovered functions
  - Add tests for 10 uncovered branches
- [ ] **src/components/configuration/AdvancedSettingsTab.tsx** (23.8% avg) - Expand test coverage
  - Add tests for 1 uncovered functions
  - Add tests for 4 uncovered branches
- [ ] **src/components/configuration/ConfigurationHeader.tsx** (22.2% avg) - Expand test coverage
  - Add tests for 1 uncovered functions
  - Add tests for 2 uncovered branches
- [ ] **src/components/configuration/ConfigurationStatusMessages.tsx** (20.8% avg) - Expand test coverage
  - Add tests for 2 uncovered functions
  - Add tests for 8 uncovered branches
- [ ] **src/components/configuration/ConfigurationTabs.tsx** (20.0% avg) - Expand test coverage
  - Add tests for 1 uncovered functions
  - Add tests for 4 uncovered branches
- [ ] **src/components/configuration/LlamaServerSettingsTab.tsx** (16.7% avg) - Expand test coverage
  - Add tests for 2 uncovered functions
  - Add tests for 26 uncovered branches
- [ ] **src/components/configuration/GeneralSettingsTab.tsx** (14.8% avg) - Expand test coverage
  - Add tests for 4 uncovered functions
  - Add tests for 6 uncovered branches
- [ ] **src/components/configuration/LoggerSettingsTab.tsx** (9.5% avg) - Expand test coverage
  - Add tests for 8 uncovered functions
  - Add tests for 18 uncovered branches
- [ ] **src/lib/websocket-client.ts** (5.8% avg) - Expand test coverage
  - Add tests for 21 uncovered functions
  - Add tests for 18 uncovered branches
- [ ] **src/lib/websocket-transport.ts** (3.6% avg) - Expand test coverage
  - Add tests for 8 uncovered functions
  - Add tests for 19 uncovered branches

### Priority 3: Files with <75% Coverage (⚠️⚠️)

- [ ] **src/server/services/LlamaService.ts** (69.6% avg) - Cover 8 functions, 91 branches
- [ ] **src/config/app.config.ts** (62.5% avg) - Cover 1 branches
- [ ] **src/components/dashboard/ModelsListCard.tsx** (58.4% avg) - Cover 4 functions, 13 branches
- [ ] **src/contexts/ThemeContext.tsx** (55.5% avg) - Cover 6 functions, 10 branches
- [ ] **src/utils/api-client.ts** (53.0% avg) - Cover 4 functions, 10 branches
- [ ] **src/components/dashboard/ModernDashboard.tsx** (51.6% avg) - Cover 14 functions, 14 branches

### Priority 4: Files with 75-99% Coverage (⚠️)

- [ ] **src/components/pages/LogsPage.tsx** (99.0% avg) - Polish: 1 branches
- [ ] **src/server/services/llama/processManager.ts** (96.4% avg) - Polish: 1 branches
- [ ] **src/lib/store.ts** (92.0% avg) - Polish: 4 functions, 1 branches
- [ ] **src/lib/logger.ts** (92.0% avg) - Polish: 1 functions, 2 branches
- [ ] **src/lib/monitor.ts** (86.5% avg) - Polish: 1 functions, 1 branches
- [ ] **src/components/layout/Header.tsx** (80.3% avg) - Polish: 1 functions

## Quick Wins

Files with 50-90% coverage that can be brought to 100% with targeted tests:

| File | Current | Target | Gap |
|------|---------|--------|-----|
| src/lib/monitor.ts | 86.5% | 100% | 13.5% |
| src/components/layout/Header.tsx | 80.3% | 100% | 19.7% |
| src/server/services/LlamaService.ts | 69.6% | 100% | 30.4% |
| src/hooks/use-api.ts | 66.7% | 100% | 33.3% |
| src/config/app.config.ts | 62.5% | 100% | 37.5% |
| src/components/dashboard/ModelsListCard.tsx | 58.4% | 100% | 41.6% |
| src/contexts/ThemeContext.tsx | 55.5% | 100% | 44.5% |
| src/utils/api-client.ts | 53.0% | 100% | 47.0% |
| src/components/dashboard/ModernDashboard.tsx | 51.6% | 100% | 48.4% |

## Statistics Summary

- **Total Files Tested**: 30
- **100% Coverage**: 4 files
- **75-99% Coverage**: 6 files
- **50-74% Coverage**: 7 files
- **1-49% Coverage**: 12 files
- **0% Coverage**: 1 files
- **Files Needing Tests**: 13
- **Files Needing Polish**: 13

## Work Required to Reach 98% Coverage

- **Current Average**: 52.50%
- **Target**: 98%
- **Gap**: 45.50% (across 30 files)
- **Equivalent to improving**: 14 files by 100%

### Minimum Viable Test Set

To maximize impact with minimum effort:

- **src/components/configuration/ConfigurationActions.tsx** (25.0% → 100% = +75.0% gain)
- **src/services/api-service.ts** (24.8% → 100% = +75.2% gain)
- **src/components/configuration/ModernConfiguration.tsx** (24.4% → 100% = +75.6% gain)
- **src/components/configuration/AdvancedSettingsTab.tsx** (23.8% → 100% = +76.2% gain)
- **src/components/configuration/ConfigurationHeader.tsx** (22.2% → 100% = +77.8% gain)
- **src/components/configuration/ConfigurationStatusMessages.tsx** (20.8% → 100% = +79.2% gain)
- **src/components/configuration/ConfigurationTabs.tsx** (20.0% → 100% = +80.0% gain)
- **src/components/configuration/LlamaServerSettingsTab.tsx** (16.7% → 100% = +83.3% gain)
- **src/components/configuration/GeneralSettingsTab.tsx** (14.8% → 100% = +85.2% gain)
- **src/components/configuration/LoggerSettingsTab.tsx** (9.5% → 100% = +90.5% gain)
