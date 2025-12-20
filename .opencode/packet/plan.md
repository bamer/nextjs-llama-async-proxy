# Implementation Plan: Real Data Integration and MUI Modernization

## 1. Services Not Fully Functional

### Model Discovery Service
- **File**: `src/app/api/models/route.tsx`
- **Issue**: POST endpoint uses hardcoded `simulatedModels` array instead of real filesystem scanning
- **Description**: Should scan provided paths for model files (.bin, .quant.bin, etc.) and discover real models using the existing `ModelDiscoveryService`

### Users API
- **File**: `src/app/api/users/route.ts`
- **Issue**: Falls back to mock user data when system process fetching fails
- **Description**: Should always attempt real system process monitoring and only use mock data as last resort; improve error handling

### Monitoring Metrics Service
- **File**: `src/components/pages/ApiRoutes.tsx`
- **Issue**: `metricsService` returns static/mock values for uptime, CPU, memory
- **Description**: Should collect real system metrics, process status, and performance data

### Analytics API
- **File**: `app/api/analytics/route.ts`
- **Issue**: Uses `Math.random()` placeholders for activeSessions, requestsPerMinute, averageResponseTime
- **Description**: Should implement proper request tracking, session management, and response time measurement

## 2. Recommendations for Real Data Sources

### Model Discovery
- Integrate existing `ModelDiscoveryService.ts` for real filesystem scanning
- Use `fs` and `path` modules to traverse directories and identify model files
- Validate model formats and extract metadata from file headers

### Users API
- Enhance system process monitoring with more robust error handling
- Consider using `node-ps` or similar libraries for cross-platform process listing
- Implement caching to reduce system calls while maintaining realtime updates

### Monitoring Metrics
- Use `process.cpuUsage()`, `process.memoryUsage()`, and `os` module for system metrics
- Integrate with existing `monitor.ts` and `captureMetrics()` function
- Add historical data collection and persistence

### Analytics
- Implement middleware for request/response tracking
- Use session stores or in-memory counters for active sessions
- Add performance monitoring hooks for response times

## 3. UI Improvement Plan with Material-UI

### Current MUI Usage
- Limited to: Box, Typography, Card, CardActions, CardContent, Button
- Used in: EnhancedMetricCard, RealTimeStatusBadge, Card components

### Modernization Strategy
- **Navigation**: Replace custom Sidebar/Header with MUI AppBar + Drawer
- **Layout**: Implement MUI Grid system for responsive layouts
- **Data Display**: Add DataGrid, Table, Charts components
- **Forms**: Use TextField, Select, FormControl for better UX
- **Feedback**: Integrate Snackbar, Alert, Dialog components
- **Theming**: Extend ThemeContext to support MUI theme provider

### Component Integration Plan
- Dashboard: Add charts with MUI X DataGrid and Charts
- Models: Use Table for model listing with sorting/filtering
- Monitoring: Enhanced metrics cards with progress indicators
- Settings: Form components with validation
- Global: Consistent AppBar with navigation drawer

## 4. Task Breakdown

### Issue 1: Implement Real Model Discovery
**Title**: `[backend] Replace simulated model discovery with real filesystem scanning`
**Description**: Update POST /api/models to use ModelDiscoveryService for actual file system scanning instead of hardcoded models
**Acceptance Criteria**:
- Scans provided paths recursively for model files
- Validates file formats and extracts metadata
- Returns real discovered models or appropriate error
- Maintains backward compatibility with existing API
**Estimated Complexity**: Medium
**Related Files**:
- `src/app/api/models/route.tsx`
- `src/lib/services/ModelDiscoveryService.ts`
- `src/config/models_config.json`

### Issue 2: Enhance Users API Reliability
**Title**: `[backend] Improve users API to minimize mock data fallback`
**Description**: Enhance system process fetching with better error handling and cross-platform support
**Acceptance Criteria**:
- Real process data fetched in >95% of cases
- Improved error logging and recovery
- Cross-platform process monitoring
- Maintains realtime SSE streaming
**Estimated Complexity**: Medium
**Related Files**:
- `src/app/api/users/route.ts`

### Issue 3: Implement Real Monitoring Metrics
**Title**: `[backend] Replace mock metrics with real system monitoring`
**Description**: Collect actual system metrics using process and OS APIs
**Acceptance Criteria**:
- Real CPU, memory, uptime values
- Historical data collection
- Integration with existing monitor utilities
- Accurate model status tracking
**Estimated Complexity**: High
**Related Files**:
- `src/components/pages/ApiRoutes.tsx`
- `src/lib/monitor.ts`
- `src/lib/process-manager.ts`

### Issue 4: Complete Analytics Implementation
**Title**: `[backend] Replace placeholder analytics with real metrics`
**Description**: Implement proper tracking for sessions, requests, and response times
**Acceptance Criteria**:
- Real active session counts
- Accurate requests per minute
- Measured average response times
- No Math.random() usage
**Estimated Complexity**: High
**Related Files**:
- `app/api/analytics/route.ts`
- `middleware.ts` (for request tracking)

### Issue 5: Modernize Navigation with MUI
**Title**: `[frontend] Replace custom header/sidebar with MUI AppBar and Drawer`
**Description**: Create consistent navigation using Material-UI components
**Acceptance Criteria**:
- Responsive AppBar with theme toggle
- Collapsible Drawer navigation
- Consistent styling across pages
- Accessibility compliant
**Estimated Complexity**: Medium
**Related Files**:
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `app/layout.tsx`

### Issue 6: Add Data Tables and Charts
**Title**: `[frontend] Integrate MUI DataGrid and Charts components`
**Description**: Replace basic lists with advanced data display components
**Acceptance Criteria**:
- Models page uses DataGrid with sorting/filtering
- Dashboard includes charts for metrics
- Responsive design maintained
- Performance optimized for large datasets
**Estimated Complexity**: Medium
**Related Files**:
- `src/components/pages/ModelsPage.tsx`
- `src/components/pages/DashboardPage.tsx`
- `src/components/ui/Charts.tsx`

### Issue 7: Enhance Forms with MUI Components
**Title**: `[frontend] Modernize forms with MUI TextField and validation`
**Description**: Replace basic inputs with Material-UI form components
**Acceptance Criteria**:
- Settings page uses proper form controls
- Input validation and error states
- Consistent styling and UX
- Accessibility features
**Estimated Complexity**: Low
**Related Files**:
- `src/components/pages/SettingsPage.tsx`
- `src/components/pages/ConfigurationPage.tsx`

### Issue 8: Add Feedback Components
**Title**: `[frontend] Integrate MUI Alert, Snackbar, and Dialog`
**Description**: Add proper user feedback for actions and errors
**Acceptance Criteria**:
- Success/error notifications for API calls
- Confirmation dialogs for destructive actions
- Loading states with progress indicators
- Toast messages for realtime updates
**Estimated Complexity**: Low
**Related Files**:
- `src/components/layout/Layout.tsx`
- `src/hooks/useWebSocket.ts`

## 5. Documentation Update Plan

### API Documentation Updates
- **Agent**: Documentation agent
- **Files**: `docs/API.md`
- **Updates**: Document real data endpoints, remove mock data references, add error handling examples

### Component Documentation
- **Agent**: Documentation agent
- **Files**: `src/components/README.md` (create if needed)
- **Updates**: Document MUI component usage patterns and theming

### Development Standards
- **Agent**: Documentation agent
- **Files**: `AGENTS.md`
- **Updates**: Add MUI integration guidelines, component naming conventions

## 6. Execution Timeline

### Phase 1: Backend Real Data (Week 1-2)
1. Issue 1: Real Model Discovery
2. Issue 2: Enhanced Users API
3. Issue 3: Real Monitoring Metrics

### Phase 2: Frontend Modernization (Week 3-4)
4. Issue 5: MUI Navigation
5. Issue 6: Data Tables and Charts
6. Issue 7: Enhanced Forms

### Phase 3: Advanced Features (Week 5-6)
7. Issue 4: Complete Analytics
8. Issue 8: Feedback Components

### Phase 4: Documentation and Testing (Week 7)
- Documentation updates
- Integration testing
- Performance validation

**Total Estimated Time**: 6-7 weeks
**Parallel Work**: Frontend and backend tasks can proceed simultaneously where dependencies allow</content>
<parameter name="filePath">.opencode/packet/plan.md