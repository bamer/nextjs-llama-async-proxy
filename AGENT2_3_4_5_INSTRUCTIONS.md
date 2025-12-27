# AGENTS 2-5 Testing Instructions
## Multi-Agent Parallel Execution Plan

**Status:** Ready for Parallel Execution  
**Overall Target:** 98% Coverage  
**Current:** 19.13% (66 tests passing)  

---

## 🔵 AGENT 2: Server Services & API Integration
### Duration: 1-2 weeks
### Coverage Impact: +20-30%

**Target Files & Current Coverage:**
- `src/server/services/LlamaService.ts` (0%)
- `src/server/services/LlamaServerIntegration.ts` (0%)
- `src/services/api-service.ts` (0%)
- `src/lib/services/ModelDiscoveryService.ts` (0%)
- `src/lib/services/parameterService.ts` (0%)
- `src/lib/ollama.ts` (67.14% → 98%)
- `src/lib/api-client.ts` (53.01% → 98%)
- `src/lib/websocket-transport.ts` (45.74% → 98%)

**Test File Location:**
`__tests__/services/agent2-services.test.ts`

**Test Categories to Implement:**

1. **API Service Tests** (`src/services/api-service.ts`)
   - Service initialization
   - HTTP request methods (GET, POST, PUT, DELETE)
   - Error handling
   - Response parsing
   - Request validation
   - Timeout handling
   - Retry logic
   - Authentication

2. **Llama Service Tests** (`src/server/services/LlamaService.ts`)
   - Service initialization
   - Model loading
   - Model inference
   - Process management
   - Resource cleanup
   - Error recovery
   - State management
   - Multi-model handling

3. **Server Integration Tests** (`src/server/services/LlamaServerIntegration.ts`)
   - Server startup
   - Configuration loading
   - Service registration
   - Health checks
   - Graceful shutdown
   - Error handling

4. **ModelDiscoveryService Tests** (`src/lib/services/ModelDiscoveryService.ts`)
   - Model discovery
   - File scanning
   - Metadata extraction
   - Caching
   - Update detection
   - Error handling

5. **ParameterService Tests** (`src/lib/services/parameterService.ts`)
   - Parameter validation
   - Type conversion
   - Default values
   - Range checking
   - Error handling

6. **Ollama Integration Tests** (`src/lib/ollama.ts`)
   - API communication
   - Model inference
   - Stream handling
   - Response parsing
   - Error handling
   - Timeout handling
   - Retry logic

7. **API Client Tests** (`src/lib/api-client.ts`)
   - HTTP client initialization
   - Request interceptors
   - Response interceptors
   - Error handling
   - Retry logic
   - Timeout handling
   - Authentication

8. **WebSocket Transport Tests** (`src/lib/websocket-transport.ts`)
   - Message formatting
   - Transmission
   - Receive handling
   - Connection state
   - Error handling
   - Cleanup

**Mocking Strategy:**
- Mock filesystem for file operations
- Mock HTTP calls with jest-mock-axios or similar
- Mock child processes for Llama spawning
- Mock Socket.IO for WebSocket tests
- Use jest.mock() for service dependencies

**Test Pattern Example:**
```typescript
describe('APIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const service = new APIService();
      expect(service).toBeDefined();
    });
  });

  describe('GET requests', () => {
    it('should make GET request to correct endpoint', async () => {
      // Mock axios/fetch
      const service = new APIService();
      const result = await service.get('/api/models');
      expect(result).toBeDefined();
    });

    it('should handle GET errors', async () => {
      // Mock error response
      const service = new APIService();
      await expect(service.get('/invalid')).rejects.toThrow();
    });
  });
});
```

**Success Criteria:**
- All 8 files have 98%+ coverage
- Edge cases tested (timeouts, errors, empty responses)
- Integration points mocked correctly
- 40-50 tests total

---

## 🟢 AGENT 3: Dashboard Components
### Duration: 2-3 weeks
### Coverage Impact: +15-25%

**Target Directory:**
`src/components/dashboard/`

**Component Files to Test (estimate 25+ files):**
- MetricCard.tsx
- SystemHealth.tsx
- PerformanceChart.tsx
- ResourceMonitor.tsx
- ModelsListCard.tsx
- StatusIndicator.tsx
- AlertPanel.tsx
- CPUChart.tsx
- MemoryChart.tsx
- RequestsChart.tsx
- LogViewer.tsx
- ModelSelector.tsx
- ConfigPanel.tsx
- DetailedMetrics.tsx
- *... all other dashboard components*

**Test File Location:**
`__tests__/components/agent3-dashboard.test.ts`

**Test Categories per Component:**

1. **Rendering Tests**
   - Component renders without crashing
   - Correct props rendered
   - Conditional rendering (loading, error, data)

2. **Props Validation**
   - Props with correct types accepted
   - Props with wrong types handled
   - Optional props default correctly
   - Required props enforce presence

3. **Event Handling**
   - Click handlers work
   - Form submissions work
   - Data updates trigger callbacks
   - Selection changes propagate

4. **Data Visualization**
   - Charts render with data
   - Charts handle empty data
   - Charts update on prop change
   - Tooltips/legends display correctly

5. **Error States**
   - Error messages display
   - Fallback UI shows
   - Error recovery works

6. **Loading States**
   - Loading skeleton/spinner shows
   - Loading state clears on data
   - Loading persists on error

7. **Integration**
   - Child components integrate correctly
   - Data flows through component tree
   - Parent-child communication works

**Mocking Strategy:**
- Mock Zustand store (useStore)
- Mock React Query hooks (useQuery, useMutation)
- Mock chart libraries (Chart.js, etc.)
- Mock API calls
- Mock Next.js router

**Test Pattern Example:**
```typescript
describe('MetricCard Component', () => {
  it('should render metric with value', () => {
    const { getByText } = render(
      <MetricCard label="CPU" value={50} unit="%" />
    );
    expect(getByText('CPU')).toBeInTheDocument();
    expect(getByText('50%')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    const { getByTestId } = render(
      <MetricCard label="CPU" loading={true} />
    );
    expect(getByTestId('metric-skeleton')).toBeInTheDocument();
  });

  it('should display error message', () => {
    const { getByText } = render(
      <MetricCard label="CPU" error="Failed to load" />
    );
    expect(getByText('Failed to load')).toBeInTheDocument();
  });
});
```

**Success Criteria:**
- All dashboard components have 98%+ coverage
- Rendering, props, events, data all tested
- Integration with store/API tested
- 100-150+ tests total

---

## 🟡 AGENT 4: Layout & Page Components
### Duration: 2 weeks
### Coverage Impact: +10-15%

**Target Files:**
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/NavBar.tsx`
- `src/components/layout/Footer.tsx`
- `app/page.tsx` (main page)
- `app/dashboard/page.tsx`
- `app/models/page.tsx`
- `app/logs/page.tsx`
- `app/settings/page.tsx`
- *... all other page components*

**Test File Location:**
`__tests__/pages/agent4-layout-pages.test.ts`

**Test Categories:**

1. **Layout Components**
   - Header renders correctly
   - Navigation links are present
   - Sidebar toggles open/close
   - Footer displays copyright/links
   - Responsive behavior (mobile, tablet, desktop)
   - Theme switching
   - User menu/account settings

2. **Page Components**
   - Page renders without error
   - Page fetches initial data
   - Page handles loading states
   - Page handles error states
   - Page displays correct content
   - Navigation works

3. **Routing**
   - Links navigate to correct pages
   - URL parameters work
   - Query params preserved
   - Back button works
   - Browser history works

4. **User Interactions**
   - Buttons trigger actions
   - Forms submit correctly
   - Search/filter works
   - Pagination works
   - Sorting works

5. **Integration**
   - Layouts wrap pages correctly
   - Data flows from store to UI
   - API calls work
   - WebSocket updates trigger UI updates

**Mocking Strategy:**
- Mock Next.js router
- Mock Next.js Link component
- Mock Zustand store
- Mock API calls
- Mock WebSocket

**Test Pattern Example:**
```typescript
describe('Dashboard Page', () => {
  it('should render dashboard heading', () => {
    const { getByText } = render(<DashboardPage />);
    expect(getByText('Dashboard')).toBeInTheDocument();
  });

  it('should fetch metrics on mount', async () => {
    const { getByText } = render(<DashboardPage />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/system/metrics');
    });
  });

  it('should display loading state initially', () => {
    const { getByTestId } = render(<DashboardPage />);
    expect(getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

**Success Criteria:**
- All layout and page components tested
- Routing tested
- Integration tested
- 60-80+ tests total

---

## 🟠 AGENT 5: Configuration, Utilities & UI Components
### Duration: 1-2 weeks
### Coverage Impact: +10-20%

**Target Files:**
- `src/config/app.config.ts` (config tests)
- `src/config/monitoring.config.ts`
- `src/config/llama-defaults.ts`
- `src/lib/validators.ts`
- `src/lib/error-handler.ts` (partial)
- `src/lib/analytics.ts` (72.22% → 98%)
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Tabs.tsx`
- `src/components/ui/ErrorBoundary.tsx`
- `src/utils/*.ts` (all utilities)

**Test File Location:**
`__tests__/utils/agent5-config-utils.test.ts`

**Test Categories:**

1. **Configuration Tests** (app.config.ts, monitoring.config.ts, llama-defaults.ts)
   - Config loads correctly
   - Config defaults work
   - Config validation
   - Config env overrides
   - Config merging

2. **Validator Tests** (src/lib/validators.ts)
   - String validation
   - Number validation
   - Email validation
   - URL validation
   - Date validation
   - Custom validation rules
   - Error messages

3. **Analytics Tests** (src/lib/analytics.ts - 72.22%)
   - Event tracking
   - Custom properties
   - User identification
   - Session tracking
   - Error tracking
   - Performance metrics

4. **Error Handler Tests** (src/lib/error-handler.ts)
   - Error parsing
   - Error formatting
   - Error logging
   - Error recovery
   - Fallback messages

5. **UI Component Tests**
   - Button: click handling, states, variants
   - Input: value changes, validation, focus
   - Modal: open/close, backdrop click, animation
   - Card: content rendering, headers, footers
   - Tabs: switching, disabled states, nested content
   - ErrorBoundary: error catching, fallback UI

6. **Utility Function Tests**
   - String utilities (trim, capitalize, etc.)
   - Array utilities (flatten, unique, etc.)
   - Date utilities (format, parse, etc.)
   - Object utilities (merge, pick, etc.)
   - Number utilities (format, round, etc.)

**Mocking Strategy:**
- Mock environment variables
- Mock window/localStorage for config
- Mock Analytics SDK
- Mock console for error logging
- No mocking needed for pure utilities

**Test Pattern Example:**
```typescript
describe('Validators', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should accept valid URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false);
    });
  });
});
```

**Success Criteria:**
- All config files 98%+ coverage
- All validators 98%+ coverage
- Analytics 98%+ coverage
- All UI components 98%+ coverage
- All utilities 98%+ coverage
- 80-100+ tests total

---

## Execution Guidelines

### For Each Agent:

1. **Preparation**
   - Read target file source code thoroughly
   - Understand component/module purpose
   - Identify dependencies and mocking needs
   - List all functions/branches to test

2. **Test Creation**
   - Follow existing test patterns in codebase
   - Use React Testing Library for components
   - Use Jest for utilities/services
   - Use `act()` for state changes
   - Mock external dependencies

3. **Coverage Verification**
   - Ensure 98%+ statement coverage
   - Ensure 98%+ branch coverage
   - Ensure 98%+ function coverage
   - No untested code paths
   - All error paths covered

4. **Testing**
   - Run individual test files
   - Run entire test suite
   - Check no regressions
   - Verify no console errors

5. **Documentation**
   - Add brief comments for complex tests
   - Document mocking strategies
   - Note edge cases covered

### Code Style Requirements:
- Follow AGENTS.md guidelines
- Use double quotes
- Use semicolons
- 2-space indentation
- Max 100 character lines
- No `any` types
- TypeScript strict mode

### Mocking Requirements:
- Mock all external APIs
- Mock all network calls
- Mock filesystem operations
- Use jest.mock() consistently
- Clear mocks between tests
- Document mock behavior

---

## Progress Tracking

Create a progress file in your test suite:
```typescript
/**
 * AGENT X Progress
 * ================
 * Files Completed: X / Y
 * Tests Created: Z
 * Coverage: ABC%
 */
```

## Final Merge

Once all agents complete:
1. Merge all test files into main test suite
2. Run full coverage report
3. Verify 98% threshold met
4. Update master coverage report
5. Document final results

---

## Resources

**Reference Files:**
- `AGENTS.md` - Code style guidelines
- `AGENT1_COMPLETION_REPORT.md` - Example test patterns
- `__tests__/lib/agent1-*.test.ts` - Working examples
- `jest.config.ts` - Jest configuration

**Key Patterns:**
- Zustand store testing: Use `act()` and `getState()`
- React hooks: Use `renderHook()` from Testing Library
- Async operations: Use `waitFor()` and `async/await`
- Mocking: Use `jest.mock()` and `jest.fn()`

---

**Last Updated:** 2024-12-27  
**Target Completion:** 3-5 weeks total  
**Parallel Execution:** All 4 agents can work simultaneously
