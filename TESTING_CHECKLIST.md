# LlamaRouterCard Component - Testing Checklist

## Pre-Test Checklist

- [ ] Dependencies installed: `pnpm install`
- [ ] No TypeScript/build errors
- [ ] Server can start: `pnpm start`
- [ ] Browser can access `http://localhost:3000`
- [ ] Python 3.x installed: `python --version`
- [ ] Playwright installed: `python -m pip list | grep playwright`

## Test Execution Checklist

### Setup Phase
- [ ] Terminal 1: Run `pnpm start`
- [ ] Wait 5-10 seconds for server startup
- [ ] Verify server logs show no errors
- [ ] Terminal 2: Navigate to project directory
- [ ] Verify `http://localhost:3000` is accessible

### Component Rendering Test
```bash
python test-llama-router-card-fixes.py
```

During execution, verify:
- [ ] TEST 1: Skeleton UI renders immediately
  - [ ] 4 glance items found
  - [ ] All showing "..."
- [ ] TEST 2: Status badge renders correctly
  - [ ] Status text is valid (STOPPED/LOADING/RUNNING)
  - [ ] Status indicator has correct class
- [ ] TEST 3: Detailed metrics render
  - [ ] Metrics area visible
  - [ ] 3 metric groups found
- [ ] TEST 4: Control buttons render
  - [ ] Toggle button shows correct text
  - [ ] Restart button exists
- [ ] TEST 5: Preset select dropdown
  - [ ] Select visible
  - [ ] Options exist
- [ ] TEST 6: Details toggle button
  - [ ] Button exists
  - [ ] Can click and expand/collapse
- [ ] TEST 7: Header renders
  - [ ] Title contains "Llama Router"
- [ ] TEST 8: Event handlers attached
  - [ ] Action buttons have handlers
- [ ] TEST 9: No console errors
  - [ ] No critical errors logged
- [ ] TEST 10: Layout structure correct
  - [ ] All sections visible

### Integration Test
```bash
python test-router-card-integration.py
```

During execution, verify:
- [ ] TEST 1: Socket.IO connected
  - [ ] `socketClient.isConnected === true`
- [ ] TEST 2: State manager initialized
  - [ ] `stateManager.subscribe` exists
- [ ] TEST 3: Config loaded
  - [ ] Config state accessible
- [ ] TEST 4: Presets loaded
  - [ ] Presets array populated
- [ ] TEST 5: Llama server status
  - [ ] Status state exists
- [ ] TEST 6: Router status
  - [ ] Router state exists
- [ ] TEST 7: Event listeners attached
  - [ ] All required handlers present
- [ ] TEST 8: Button click handling
  - [ ] No errors on click
- [ ] TEST 9: State subscriptions work
  - [ ] Subscribe method available
- [ ] TEST 10: Preset selection works
  - [ ] Can select preset
- [ ] TEST 11: Details toggle works
  - [ ] Can expand/collapse
- [ ] TEST 12: Metrics display
  - [ ] Correct number of items

## Expected Test Results

### Success Criteria
- [ ] Component test: "✅ ALL TESTS PASSED"
- [ ] Integration test: "✅ ALL INTEGRATION TESTS PASSED"
- [ ] No timeout errors
- [ ] No assertion failures
- [ ] Both tests complete in < 30 seconds total

### On Failure
- [ ] Screenshot exists at `/tmp/test-failure.png`
- [ ] Screenshot shows what went wrong
- [ ] Error message is clear and actionable
- [ ] Server logs show related errors (if any)

## Critical Fixes Verification

### Fix 1: Skeleton UI
- [ ] Component renders immediately (not waiting for data)
- [ ] Shows "..." placeholders while loading
- [ ] DOM structure complete before state updates
- [ ] No flickering or layout shifts

### Fix 2: Cache Promise
- [ ] All cache calls return Promises
- [ ] No mixing of sync/async operations
- [ ] State updates propagate correctly
- [ ] No "Cannot read property of undefined" errors

### Fix 3: Socket Response
- [ ] Socket.IO connection established
- [ ] Button clicks trigger socket events
- [ ] Server responses arrive correctly
- [ ] State updates reflect socket responses

### Fix 4: Controller Simplification
- [ ] No StateAPI wrapper in use
- [ ] Direct state manager calls work
- [ ] Event handlers execute without errors
- [ ] Socket requests complete successfully

## Performance Verification

- [ ] Component renders in < 100ms
- [ ] Socket connection in < 1 second
- [ ] State updates in < 500ms
- [ ] Tests complete in < 30 seconds total

## Visual Verification (Optional)

When running with browser visible (`headless=False`):

- [ ] Status card appears immediately
- [ ] Glance metrics show "..." initially
- [ ] Detailed metrics area hides initially
- [ ] Header shows correct port number
- [ ] Buttons are clickable
- [ ] Preset dropdown opens
- [ ] Details toggle expands smoothly

## Regression Tests

After making changes, verify:

- [ ] Component test still passes
- [ ] Integration test still passes
- [ ] No new console errors
- [ ] No performance degradation
- [ ] All fixes still applied

## Troubleshooting Checklist

### If tests don't find server:
- [ ] `curl http://localhost:3000` returns 200
- [ ] Server is still running in Terminal 1
- [ ] No port conflicts (another service on 3000)
- [ ] Firewall not blocking localhost:3000

### If tests timeout:
- [ ] Server started and ready (5-10 seconds)
- [ ] Network is stable
- [ ] No high CPU/memory usage
- [ ] Check server logs for errors
- [ ] Try running test again

### If tests fail:
- [ ] Check screenshot at `/tmp/test-failure.png`
- [ ] Review actual error message
- [ ] Check server logs for related errors
- [ ] Verify component code has fixes applied
- [ ] Verify no syntax errors in component

### If socket test fails:
- [ ] Check Socket.IO server handler exists
- [ ] Verify socket.emit() is used (not ack())
- [ ] Check state manager has socket property
- [ ] Verify client can connect to socket server

### If state test fails:
- [ ] Verify stateManager is initialized
- [ ] Check subscribe method exists
- [ ] Verify state keys are set correctly
- [ ] Check no state initialization errors in logs

## Final Verification

Once all tests pass:

- [ ] Component renders correctly
- [ ] Socket.IO works
- [ ] State management works
- [ ] Event handlers work
- [ ] No memory leaks
- [ ] No console errors
- [ ] All fixes are applied
- [ ] Code is production-ready

## Sign-Off

- [ ] All tests passed ✅
- [ ] No blocking issues found
- [ ] Performance acceptable
- [ ] Ready for production

**Date Tested**: ________________  
**Tester Name**: ________________  
**Notes**: ___________________
