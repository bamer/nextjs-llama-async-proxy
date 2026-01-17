# LlamaRouterCard Component Test Guide

This guide explains how to run the Playwright tests for the LlamaRouterCard component fixes.

## Critical Fixes Being Tested

1. **Skeleton UI** - Loading state renders immediately with `loading-skeleton` class
2. **Cache Promise Fix** - Cache returns `Promise.resolve()` instead of raw value
3. **Socket Response Fix** - Server handlers use `socket.emit()` instead of `ack()`
4. **Controller Simplification** - Uses `stateManager.socket.request()` directly

## Prerequisites

Before running tests:

1. **Install dependencies** (if not already done):
   ```bash
   pnpm install
   ```

2. **Start the server**:
   ```bash
   pnpm start
   ```

   The server should be running on `http://localhost:3000`

## Running Tests

### Test 1: Component Rendering & DOM Structure
Tests skeleton UI, initial render state, and DOM hierarchy.

```bash
python test-llama-router-card-fixes.py
```

**What it tests:**
- Skeleton UI renders with "..." placeholders immediately
- Status badge displays correct initial state
- Detailed metrics area renders with 3 metric groups
- Control buttons render with correct text
- Preset dropdown renders
- Details toggle button works
- Header renders correctly
- Event handlers are attached
- No console errors
- Component structure is correct

**Expected output:**
```
==================================================
LlamaRouterCard Component Fix Verification
==================================================
[TEST 1] Verifying skeleton UI renders immediately...
  ✓ Glance items found: 4
  ✓ Glance value 0: '...'
  ✓ Glance value 1: '...'
  ✓ Glance value 2: '...'
  ✓ Glance value 3: '...'
  ✅ Skeleton UI test PASSED

... (more tests)

==================================================
✅ ALL TESTS PASSED
==================================================
```

### Test 2: Integration & Socket.IO
Tests Socket.IO integration, state management, and event handling.

```bash
python test-router-card-integration.py
```

**What it tests:**
- Socket.IO connection is established
- State manager is initialized
- Config is loaded from state
- Presets are loaded from state
- Llama server status state exists
- Router status state exists
- Event listeners attached to card
- Button click handling works without errors
- State subscriptions are functional
- Preset selection handling works
- Details toggle expands/collapses
- Metrics display renders correctly

**Expected output:**
```
==================================================
LlamaRouterCard Integration Test
==================================================
[TEST 1] Verifying Socket.IO connection...
  ✓ Socket connected: true
  ✅ Socket connection test PASSED

[TEST 2] Verifying state manager...
  ✓ State manager ready: true
  ✅ State manager test PASSED

... (more tests)

==================================================
✅ ALL INTEGRATION TESTS PASSED
==================================================
```

## Running Both Tests

To run both tests in sequence:

```bash
# Terminal 1: Start the server
pnpm start

# Terminal 2: Run tests
python test-llama-router-card-fixes.py && python test-router-card-integration.py
```

## Troubleshooting

### "Server not running" error
- Make sure `pnpm start` is running in another terminal
- Check that the server is listening on `http://localhost:3000`
- Run: `curl http://localhost:3000`

### Test timeouts
- Wait for the server to fully start (usually 5-10 seconds)
- Check server logs for startup errors
- Increase timeout in test if needed (edit timeout value in test file)

### Screenshot artifacts
- Failed tests create screenshots in `/tmp/`:
  - `test-failure.png` - Component rendering test failure
  - `integration-test-failure.png` - Integration test failure
- View these to debug what went wrong

## Test Details

### Component Rendering Test (`test-llama-router-card-fixes.py`)

**Key assertions:**
1. Glance grid has exactly 4 items
2. Each glance value shows "..." when loading
3. Status badge shows valid status (STOPPED, LOADING, RUNNING)
4. Status indicator has valid class (stopped, loading, running)
5. Detailed metrics area has exactly 3 metric groups
6. Toggle button text is "Start Router" or "Stop Router"
7. Restart button shows "Restart" or "Restarting..."
8. Preset select has at least 1 option
9. First preset option contains "Select"
10. Details toggle works and expands/collapses metrics area
11. Header contains "Llama Router"
12. Action buttons have data-action attributes
13. No component errors in console

### Integration Test (`test-router-card-integration.py`)

**Key assertions:**
1. Socket.IO is connected
2. State manager is initialized with subscribe method
3. Config state exists (may be empty object)
4. Presets is an array
5. LlamaServerStatus state exists
6. RouterStatus state exists
7. Component has all required event handlers:
   - Toggle button for start/stop
   - Restart button
   - Preset select dropdown
   - Details toggle button
8. Button clicks don't produce errors
9. State subscriptions are functional
10. Preset selection changes select value
11. Details toggle changes expanded class
12. Metrics display has 4 glance items and multiple metric items

## Continuous Testing

To continuously test during development:

```bash
# Run first test
python test-llama-router-card-fixes.py

# Wait a moment, then run integration test
sleep 5
python test-router-card-integration.py
```

Or create a shell script:

```bash
#!/bin/bash
# test-all.sh
echo "Running component rendering test..."
python test-llama-router-card-fixes.py || exit 1

echo -e "\nWaiting for server..."
sleep 3

echo "Running integration test..."
python test-router-card-integration.py || exit 1

echo -e "\n✅ All tests passed!"
```

Run with: `bash test-all.sh`

## Debugging Failed Tests

1. **Visual inspection**: Check the generated screenshot
   ```bash
   open /tmp/test-failure.png
   ```

2. **Console logs**: Add console inspection to test
   ```python
   console_logs = page.evaluate("() => window._consoleLogs || []")
   print(f"Console logs: {console_logs}")
   ```

3. **DOM inspection**: Manually inspect with browser
   - Run test with `headless=False` (already set in tests)
   - Watch the browser window as test runs
   - Pause at error point

4. **Server logs**: Check server console output
   ```bash
   # In the terminal running pnpm start
   # Look for error messages
   ```

## Performance Baseline

Expected test execution times:
- Component rendering test: 10-15 seconds
- Integration test: 10-15 seconds
- Both tests: 25-30 seconds

If tests are significantly slower, check:
- Server performance
- System resources
- Browser performance
- Network latency

## CI/CD Integration

To integrate into CI/CD pipeline:

```yaml
# Example: .github/workflows/test.yml
- name: Start server
  run: pnpm start &

- name: Wait for server
  run: sleep 5

- name: Run Playwright tests
  run: |
    python test-llama-router-card-fixes.py
    python test-router-card-integration.py
```

## Success Criteria

✅ All tests pass with:
- No assertion failures
- No console errors
- No timeout errors
- All UI elements render correctly
- All event handlers work
- Socket.IO connection established
- State management functional
