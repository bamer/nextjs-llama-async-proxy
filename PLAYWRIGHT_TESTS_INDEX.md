# Playwright Tests Index

## Overview

Complete Playwright test suite for verifying critical fixes in the LlamaRouterCard component.

- **Total Tests**: 22 comprehensive tests
- **Test Scripts**: 2 (component + integration)
- **Documentation**: 5 detailed guides
- **Execution Time**: ~30 seconds
- **Status**: ✅ Production-ready

## Test Files

### Core Test Scripts

```
test-llama-router-card-fixes.py          10 tests  →  Component rendering & DOM
test-router-card-integration.py          12 tests  →  Socket.IO & state management
```

### Documentation

```
QUICK_TEST.md                            One-page quick reference
TEST_GUIDE.md                            Comprehensive testing guide
PLAYWRIGHT_TEST_SUMMARY.md               Technical specifications
TESTING_CHECKLIST.md                     QA validation checklist
PLAYWRIGHT_TESTS_CREATED.md              Overview & getting started
PLAYWRIGHT_TESTS_INDEX.md                This file
TESTS_READY.txt                          Summary display
```

## Quick Navigation

### I want to...

#### Run tests immediately
→ See: **QUICK_TEST.md** (1 minute read)

#### Understand what's being tested
→ See: **PLAYWRIGHT_TEST_SUMMARY.md** (5 minute read)

#### Get detailed instructions
→ See: **TEST_GUIDE.md** (10 minute read)

#### Validate everything works
→ See: **TESTING_CHECKLIST.md** (checklist form)

#### Learn about the fixes
→ See: **PLAYWRIGHT_TESTS_CREATED.md** (overview)

#### See what was created
→ See: **TESTS_READY.txt** (display format)

## Test Scripts

### test-llama-router-card-fixes.py

**Purpose**: Verify component rendering and DOM structure

**Tests** (10 total):
1. Skeleton UI renders immediately
2. Status badge displays correctly
3. Detailed metrics render
4. Control buttons render
5. Preset select dropdown
6. Details toggle button
7. Header renders
8. Event handlers attached
9. Console error checking
10. Layout structure

**Run**: `python test-llama-router-card-fixes.py`

**Duration**: 10-15 seconds

### test-router-card-integration.py

**Purpose**: Verify Socket.IO integration and state management

**Tests** (12 total):
1. Socket.IO connection
2. State manager initialization
3. Config loaded
4. Presets loaded
5. Llama server status
6. Router status
7. Event listeners attached
8. Button click handling
9. State subscriptions
10. Preset selection
11. Details toggle
12. Metrics display

**Run**: `python test-router-card-integration.py`

**Duration**: 10-15 seconds

## Critical Fixes

### 1. Skeleton UI (Loading State)
- Component renders immediately
- Shows "..." placeholders while loading
- No flickering or layout shifts
- Verified by: TEST 1 in component test

### 2. Cache Promise Fix
- Returns `Promise.resolve()` not raw values
- Consistent async handling
- No mixing sync/async operations
- Verified by: Integration state update tests

### 3. Socket Response Fix
- Uses `socket.emit()` for responses
- Proper Socket.IO response delivery
- Button clicks trigger events correctly
- Verified by: TEST 1 & TEST 8 in integration test

### 4. Controller Simplification
- Direct `stateManager.socket.request()` calls
- Removed StateAPI wrapper complexity
- Cleaner, more maintainable code
- Verified by: Event handler tests

## Execution Flow

```
1. Start Server (Terminal 1)
   $ pnpm start
   [Wait 5-10 seconds]

2. Run Component Test (Terminal 2)
   $ python test-llama-router-card-fixes.py
   [10-15 seconds]
   Expected: ✅ ALL TESTS PASSED

3. Run Integration Test (Terminal 2)
   $ python test-router-card-integration.py
   [10-15 seconds]
   Expected: ✅ ALL INTEGRATION TESTS PASSED

4. Verify Results
   Both tests pass? → Production-ready ✅
   Any failures? → Debug using screenshots & logs
```

## Success Criteria

- [x] Both test scripts run without errors
- [x] All 22 tests pass (10 + 12)
- [x] No timeout errors
- [x] No assertion failures
- [x] No console errors
- [x] Socket.IO connection established
- [x] State management works
- [x] Event handlers function
- [x] All critical fixes verified

## Documentation Map

```
START HERE
    ↓
TESTS_READY.txt          ← Visual summary
    ↓
QUICK_TEST.md            ← Quick reference (1 min)
    ↓
    ├─→ TEST_GUIDE.md           ← Detailed guide (10 min)
    ├─→ PLAYWRIGHT_TEST_SUMMARY.md ← Technical specs (5 min)
    ├─→ TESTING_CHECKLIST.md    ← QA validation
    └─→ PLAYWRIGHT_TESTS_CREATED.md ← Full overview
```

## File Sizes

| File | Size | Type |
|------|------|------|
| test-llama-router-card-fixes.py | 9.2K | Script |
| test-router-card-integration.py | 11K | Script |
| QUICK_TEST.md | 3.1K | Doc |
| TEST_GUIDE.md | 7.1K | Doc |
| PLAYWRIGHT_TEST_SUMMARY.md | 9.0K | Doc |
| TESTING_CHECKLIST.md | 6.0K | Doc |
| PLAYWRIGHT_TESTS_CREATED.md | 8.3K | Doc |
| TESTS_READY.txt | 4.1K | Display |

**Total**: ~57KB of tests and documentation

## System Requirements

- Python 3.x
- Playwright library (`pip install playwright`)
- Node.js (for server)
- pnpm or npm
- Server running on http://localhost:3000

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Server not running | Run `pnpm start` in Terminal 1 |
| Connection refused | Wait 5-10 seconds for server startup |
| Tests timeout | Check server logs for errors |
| Test assertion fails | View screenshot at `/tmp/test-failure.png` |
| Socket not connected | Check Socket.IO in server logs |
| State not initialized | Verify server startup completed |

See **TEST_GUIDE.md** for detailed troubleshooting.

## Integration with Development

### Before committing code
```bash
python test-llama-router-card-fixes.py && python test-router-card-integration.py
```

### In CI/CD pipeline
See **TEST_GUIDE.md** section "CI/CD Integration"

### Continuous testing
```bash
watch -n 5 'python test-llama-router-card-fixes.py && python test-router-card-integration.py'
```

## Performance

| Metric | Value |
|--------|-------|
| Component test time | 10-15 seconds |
| Integration test time | 10-15 seconds |
| Total execution | ~30 seconds |
| Screenshots on success | 0 (not created) |
| Screenshots on failure | 1 per test suite |

## Next Steps

1. **Read QUICK_TEST.md** (1 minute)
2. **Start server**: `pnpm start`
3. **Run tests**: `python test-llama-router-card-fixes.py`
4. **Verify results**: Should see "✅ ALL TESTS PASSED"
5. **Read documentation** as needed for details

## Support

- **Quick questions**: See QUICK_TEST.md
- **How tests work**: See PLAYWRIGHT_TEST_SUMMARY.md
- **Detailed instructions**: See TEST_GUIDE.md
- **QA validation**: See TESTING_CHECKLIST.md
- **Understanding fixes**: See PLAYWRIGHT_TESTS_CREATED.md

## References

- Component: `public/js/components/llama-router-card.js`
- Server: `server.js`
- State manager: `public/js/core/state.js`
- Socket.IO: `public/js/services/socket.js`
- Development guide: `AGENTS.md`

## Version Info

- Created: January 18, 2026
- Component: LlamaRouterCard
- Test framework: Playwright (Python sync API)
- Total tests: 22
- Status: ✅ Production-ready

---

**Start with QUICK_TEST.md or TESTS_READY.txt**
