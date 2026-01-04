# Critical Files - Line-Level Coverage Details

## Files Requiring Immediate Attention

### 1. app/logs/page.tsx (0% coverage, 128 statements)
**Impact:** Critical - User-facing logging functionality
**Uncovered Lines:** All lines need testing
**Priority:** HIGH

### 2. src/components/ui/ModelConfigDialogImproved.tsx (0% coverage, 145 statements)
**Impact:** Critical - Model configuration UI
**Uncovered Lines:** All lines need testing
**Priority:** HIGH

### 3. app/monitoring/page.tsx (0% coverage, 61 statements)
**Impact:** High - Real-time monitoring dashboard
**Uncovered Lines:** All lines need testing
**Priority:** HIGH

### 4. src/contexts/ThemeContext.tsx (0% coverage, 36 statements)
**Impact:** Medium - Theme management
**Uncovered Lines:** All lines need testing
**Priority:** MEDIUM

### 5. app/api/models/[name]/start/route.ts (10% coverage, 63 uncovered)
**Impact:** Critical - Model start functionality
**Uncovered Lines:** Most of the file
**Priority:** CRITICAL

### 6. src/server/services/llama/LlamaService.ts (17.2% coverage, 77 uncovered)
**Impact:** Critical - Core Llama service
**Uncovered Lines:** Most functions and error paths
**Priority:** CRITICAL

### 7. src/server/services/LlamaService.ts (68.14% coverage, 101 uncovered)
**Impact:** Critical - High-level service wrapper
**Uncovered Lines:** API call handling, state management
**Priority:** CRITICAL

### 8. src/lib/store.ts (81.19% coverage, 19 uncovered)
**Impact:** High - Global state management
**Uncovered Lines:** 
- 24, 25: Initial state setup
- 43, 44: State persistence setup
- 54-60: Error handling paths
- 85, 86: Update logic
- 90, 91: Validation paths
- 94, 95: Cleanup logic
- 98, 99: Edge case handling

### 9. src/lib/websocket-client.ts (78.13% coverage, 21 uncovered)
**Impact:** High - Real-time communication
**Uncovered Lines:**
- 32-51: Connection setup options
- 71, 74-78: Reconnection logic
- Others: Error handling and cleanup

### 10. src/utils/api-client.ts (68% coverage, 16 uncovered)
**Impact:** High - All API calls
**Uncovered Lines:**
- 8, 12-26: Request builder
- 38, 42, 46: Error handling
- Timeout scenarios, auth headers

---

## Immediate Actions Required

### Today (Priority Order)

1. **Fix syntax error in useConfigurationForm.test.ts** (5 min)
2. **Fix localStorage persistence tests** (30 min)
3. **Test app/not-found.tsx** (5 min) - QUICK WIN
4. **Test app/settings/page.tsx** (10 min) - QUICK WIN
5. **Test app/dashboard/page.tsx** (10 min) - QUICK WIN

### This Week

1. **Test all app pages** (7 files, 2 hours)
2. **Fix app/api/models/[name]/start/route.ts** (30 min)
3. **Improve src/server/services/LlamaService.ts** (30 min)
4. **Test src/contexts/ThemeContext.tsx** (15 min)

### Next Sprint

1. **Test src/components/ui/ModelConfigDialogImproved.tsx** (45 min)
2. **Test app/logs/page.tsx** (30 min)
3. **Test app/monitoring/page.tsx** (25 min)
4. **Complete remaining 50-98% files** (4 hours)

---

## File-by-File Testing Strategy

### Zero Coverage Files - Test All Paths

For each zero-coverage file:
1. Read the file completely
2. Identify all exported components/functions
3. List all user interactions
4. Create tests for:
   - Happy paths (normal operation)
   - Error paths (invalid input, failures)
   - Edge cases (empty, null, boundary values)
   - Loading/async states
5. Mock external dependencies
6. Run tests and verify coverage

### Partial Coverage Files - Fill Gaps

For each partial-coverage file:
1. Open coverage report: `coverage-final/lcov-report/index.html`
2. Find file in report
3. Identify uncovered lines (red markers)
4. Determine what those lines do:
   - Error handling?
   - Edge cases?
   - Async operations?
   - Conditional branches?
5. Create specific tests for those paths
6. Re-run coverage to verify improvement

---

## Testing Templates

### React Component Template
```typescript
describe('ComponentName', () => {
  const defaultProps = { /* ... */ };
  
  it('renders', () => {
    render(<ComponentName {...defaultProps} />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
  
  it('handles user action', async () => {
    const user = userEvent.setup();
    render(<ComponentName {...defaultProps} />);
    await user.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
  
  it('shows error state', () => {
    render(<ComponentName {...defaultProps} error="Failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
```

### API Route Template
```typescript
describe('API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('returns 200 on success', async () => {
    mockService.mockResolvedValue({ data: 'success' });
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
  
  it('returns 400 on validation error', async () => {
    const response = await POST(badRequest);
    expect(response.status).toBe(400);
  });
  
  it('returns 500 on service error', async () => {
    mockService.mockRejectedValue(new Error('Failed'));
    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
```

---

## Progress Checklist

### Week 1 Goals
- [ ] Fix all existing test failures
- [ ] Test all zero-coverage quick wins (9 files)
- [ ] Improve coverage to 80% statements
- [ ] Run full coverage report daily

### Week 2 Goals
- [ ] Test all high-impact files
- [ ] Improve coverage to 90% statements
- [ ] Document all new test patterns

### Week 3 Goals
- [ ] Complete medium-priority files
- [ ] Improve coverage to 95% statements
- [ ] Fix any flaky tests

### Week 4 Goals
- [ ] Complete all remaining files
- [ ] Achieve 98% coverage target ✅
- [ ] Create final report
- [ ] Present results to team

---

## Commands to Run Daily

```bash
# Morning: Run full test suite
pnpm test:coverage

# Check specific file coverage
pnpm test -- --collectCoverageFrom='src/lib/store.ts'

# View coverage report
open coverage-final/lcov-report/index.html

# Watch mode during development
pnpm test:watch
```

---

**Last Updated:** December 30, 2025
**Next Review:** Daily
**Target Date for 98%:** 4 weeks from now
