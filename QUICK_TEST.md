# Quick Start: Playwright Tests for LlamaRouterCard

## TL;DR

```bash
# Terminal 1: Start server
pnpm start

# Terminal 2: Run tests (wait 5-10 seconds for server to start)
python test-llama-router-card-fixes.py
python test-router-card-integration.py
```

## What Gets Tested

✅ Skeleton UI renders immediately  
✅ Status badge displays correctly  
✅ Metrics show "..." while loading  
✅ Control buttons work  
✅ Preset dropdown works  
✅ Details toggle expands/collapses  
✅ Socket.IO connection established  
✅ State manager initialized  
✅ Event handlers attached  
✅ No console errors  

## Test Files

| File | Purpose | Duration |
|------|---------|----------|
| `test-llama-router-card-fixes.py` | Component rendering & DOM | 10-15s |
| `test-router-card-integration.py` | Socket.IO & state management | 10-15s |

## Expected Output

```
==================================================
LlamaRouterCard Component Fix Verification
==================================================
[TEST 1] Verifying skeleton UI renders immediately...
  ✓ Glance items found: 4
  ✓ Glance value 0: '...'
  ...
  ✅ Skeleton UI test PASSED
  
[TEST 2] Verifying status badge renders correctly...
  ✓ Status text: 'STOPPED'
  ...
  ✅ Status badge test PASSED

... [8 more tests] ...

==================================================
✅ ALL TESTS PASSED
==================================================
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Server not running" | Run `pnpm start` in separate terminal |
| Connection timeout | Wait 10 seconds for server to fully start |
| Test times out | Check server logs for errors |
| Test fails | Open screenshot at `/tmp/test-failure.png` |

## Critical Fixes Verified

### 1. Skeleton UI
Loading state renders immediately with "..." placeholders

### 2. Promise Cache Fix  
Cache returns `Promise.resolve()` for consistent async handling

### 3. Socket Response Fix
Server uses `socket.emit()` instead of `ack()` for proper response delivery

### 4. Controller Simplification
Uses `stateManager.socket.request()` directly

## Complete Test Sequence

```bash
# 1. Install dependencies
pnpm install

# 2. Start server (in Terminal 1)
pnpm start

# 3. Wait 5-10 seconds for server startup

# 4. Run tests (in Terminal 2)
python test-llama-router-card-fixes.py
python test-router-card-integration.py

# 5. Verify all tests pass
```

## Files Generated

- `test-llama-router-card-fixes.py` - Component rendering tests (10 tests)
- `test-router-card-integration.py` - Integration tests (12 tests)
- `TEST_GUIDE.md` - Detailed testing documentation
- `PLAYWRIGHT_TEST_SUMMARY.md` - Comprehensive test overview

## Success = All Tests Pass

If you see this at the end of both test runs:
```
==================================================
✅ ALL TESTS PASSED
==================================================
```

Then all critical fixes are working correctly.

## For More Details

See:
- `TEST_GUIDE.md` - Complete testing guide
- `PLAYWRIGHT_TEST_SUMMARY.md` - Detailed test specifications
- `AGENTS.md` - Development guidelines
