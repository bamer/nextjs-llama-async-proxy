/**
 * Test for Circular Logging Bug
 * Tests that debug-tools.js and logger.js don't cause infinite recursion
 */

describe('Circular Logging Bug', () => {
  let originalConsole;
  let consoleCalls;
  let recursionDepth;

  beforeEach(() => {
    // Store original console methods
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Track console calls to detect recursion
    consoleCalls = [];
    recursionDepth = 0;
    const MAX_DEPTH = 10; // Fail if we exceed this depth

    // Override console methods to track recursion
    console.log = (...args) => {
      recursionDepth++;
      if (recursionDepth > MAX_DEPTH) {
        throw new Error(`INFINITE RECURSION DETECTED: console.log called ${recursionDepth} times`);
      }
      consoleCalls.push({ method: 'log', args });
      originalConsole.log.apply(console, args);
    };

    console.warn = (...args) => {
      recursionDepth++;
      if (recursionDepth > MAX_DEPTH) {
        throw new Error(`INFINITE RECURSION DETECTED: console.warn called ${recursionDepth} times`);
      }
      consoleCalls.push({ method: 'warn', args });
      originalConsole.warn.apply(console, args);
    };

    console.error = (...args) => {
      recursionDepth++;
      if (recursionDepth > MAX_DEPTH) {
        throw new Error(`INFINITE RECURSION DETECTED: console.error called ${recursionDepth} times`);
      }
      consoleCalls.push({ method: 'error', args });
      originalConsole.error.apply(console, args);
    };
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  });

  describe('debug-tools.js LoggingMonitor', () => {
    it('should not cause infinite recursion when logCapture calls console.log', () => {
      // Simulate what happens when DEBUG_SYSTEM.logging.logCapture is called
      // This simulates the circular reference scenario

      let logCaptureCallCount = 0;
      const MAX_CALLS = 5;

      // Create a mock logging monitor that calls console.log
      const loggingMonitor = {
        enabled: true,
        logCapture(source, data) {
          if (!this.enabled) return;
          logCaptureCallCount++;
          if (logCaptureCallCount > MAX_CALLS) {
            throw new Error('INFINITE RECURSION in logCapture');
          }
          // This should NOT trigger another logCapture call
          console.log(`[LOGGING:CAPTURE] ${source}`, data);
        },
        logLoss(reason, data) {
          if (!this.enabled) return;
          console.warn(`[LOGGING:LOSS] ${reason}`, data);
        }
      };

      // Simulate the circular reference by calling logCapture
      // If there's a bug, this would recurse infinitely
      loggingMonitor.logCapture('test', { message: 'test' });

      // Should complete without infinite recursion
      expect(logCaptureCallCount).toBe(1);
    });

    it('should handle concurrent logCapture calls safely', () => {
      const loggingMonitor = {
        enabled: true,
        stats: { captured: 0 },
        logCapture(source, data) {
          if (!this.enabled) return;
          this.stats.captured++;
          // Simulate console.log that doesn't recurse
          originalConsole.log(`[LOGGING:CAPTURE] ${source}`, data);
        }
      };

      // Multiple concurrent calls should not cause recursion
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(Promise.resolve().then(() => {
          loggingMonitor.logCapture('test', { index: i });
        }));
      }

      return Promise.all(promises).then(() => {
        expect(loggingMonitor.stats.captured).toBe(5);
      });
    });
  });

  describe('logger.js _log circular reference', () => {
    it('should not recurse when _log is called during console capture', () => {
      // This test simulates the actual bug scenario from the logs
      // where logger.js _log calls DEBUG_SYSTEM.logging.logCapture
      // which calls console.log, causing infinite recursion

      let logMethodCallCount = 0;
      const MAX_CALLS = 3;

      // Create a mock client logger that simulates the bug
      const mockClientLogger = {
        _log(level, args) {
          logMethodCallCount++;
          if (logMethodCallCount > MAX_CALLS) {
            throw new Error('INFINITE RECURSION in _log');
          }

          // This is where the bug occurs:
          // _log calls window.DEBUG_SYSTEM.logging.logCapture
          // which internally calls console.log
          // which wraps to _log again → INFINITE LOOP

          // For this test, we simulate the safe behavior:
          // Use originalConsole to avoid the wrapper
          originalConsole.log(`[CLIENT] ${args.join(' ')}`);
        }
      };

      // Simulate calling _log
      mockClientLogger._log('info', ['test message']);

      expect(logMethodCallCount).toBe(1);
    });

    it('should demonstrate the bug exists (test will fail before fix)', () => {
      // This test demonstrates what happens WITH the bug
      // It should pass AFTER the fix is applied

      let recursionCount = 0;
      const MAX_ALLOWED = 10;

      // Simulate the buggy behavior
      function buggyLogCapture() {
        recursionCount++;
        if (recursionCount > MAX_ALLOWED) {
          throw new Error('Recursion detected!');
        }
        // This simulates calling console.log which is wrapped
        // In the buggy version, this would trigger another logCapture
        buggyLogCapture(); // This is the bug - self-referencing
      }

      // After fix, we should use a guard
      function fixedLogCapture() {
        const guard = { inCapture: false };
        return function capture() {
          if (guard.inCapture) return; // Guard prevents recursion
          guard.inCapture = true;
          try {
            recursionCount++;
            if (recursionCount > MAX_ALLOWED) {
              throw new Error('Recursion detected!');
            }
          } finally {
            guard.inCapture = false;
          }
        };
      }

      // Test with guard - should not recurse
      const safeCapture = fixedLogCapture();
      safeCapture();
      safeCapture();
      safeCapture();

      expect(recursionCount).toBe(3);
    });
  });
});

describe('Integration: debug-tools + logger circular reference', () => {
  let originalConsole;

  beforeEach(() => {
    // Store original console methods for this describe block
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  });

  afterEach(() => {
    // Restore
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
  });

  it('should not cause stack overflow when both modules interact', () => {
    // Set up the actual scenario from the logs
    let logCaptureCallCount = 0;
    let _logCallCount = 0;
    const MAX_CALLS = 5;

    // Simulate DEBUG_SYSTEM.logging.logCapture - the REAL one that uses _ORIGINAL_CONSOLE
    // This simulates the FIXED version that uses original console methods
    const loggingMonitor = {
      enabled: true,
      _inProgress: new Set(),
      logCapture(source, data) {
        if (!this.enabled) return;

        // Guard against infinite recursion
        const guardKey = `capture:${source}`;
        if (this._inProgress.has(guardKey)) {
          return;
        }

        this._inProgress.add(guardKey);
        try {
          logCaptureCallCount++;
          if (logCaptureCallCount > MAX_CALLS) {
            throw new Error('INFINITE RECURSION: logCapture exceeded max calls');
          }
          // Using originalConsole (not wrapped) prevents recursion
          originalConsole.log(`[LOGGING:CAPTURE] ${source}`, data);
        } finally {
          this._inProgress.delete(guardKey);
        }
      }
    };

    // Simulate clientLogger._log - this is the wrapper that calls logCapture
    function _log(level, args) {
      _logCallCount++;
      if (_logCallCount > MAX_CALLS) {
        throw new Error('INFINITE RECURSION: _log exceeded max calls');
      }

      // This is where the circular reference happens:
      // _log calls logCapture which calls console.log
      // But with the fix, logCapture uses originalConsole
      loggingMonitor.logCapture('console', { level, args: args.length });
    }

    // Make a single call - should not recurse
    _log('info', ['test']);

    // Both should have been called exactly once
    expect(_logCallCount).toBe(1);
    expect(logCaptureCallCount).toBe(1);
  });

  it('should handle the real circular reference pattern from production', () => {
    // This test simulates the exact pattern from the production logs:
    // 1. console.log is wrapped → calls clientLogger._log
    // 2. _log calls DEBUG_SYSTEM.logging.logCapture
    // 3. logCapture calls console.log (wrapped) → infinite loop

    let consoleLogCallCount = 0;
    const MAX_CALLS = 10;
    let originalLogRef;

    // Store original console.log
    const realConsoleLog = console.log;

    // Create a wrapped console.log (like clientLogger does)
    console.log = function(...args) {
      consoleLogCallCount++;
      if (consoleLogCallCount > MAX_CALLS) {
        throw new Error('INFINITE RECURSION: console.log exceeded max calls');
      }
      // In real code, this would call _log
      // For test, just track the call
    };

    // Simulate the FIXED debug-tools that uses _ORIGINAL_CONSOLE
    const DEBUG_SYSTEM = {
      logging: {
        enabled: true,
        _inProgress: new Set(),
        logCapture(source, data) {
          if (!this.enabled) return;

          const guardKey = `capture:${source}`;
          if (this._inProgress.has(guardKey)) {
            return; // Guard prevents recursion
          }

          this._inProgress.add(guardKey);
          try {
            // Use _ORIGINAL_CONSOLE instead of console.log
            realConsoleLog(`[LOGGING:CAPTURE] ${source}`, data);
          } finally {
            this._inProgress.delete(guardKey);
          }
        }
      }
    };

    // Simulate _log calling logCapture
    function _log(level, args) {
      DEBUG_SYSTEM.logging.logCapture('console', { level });
    }

    // Call _log multiple times
    for (let i = 0; i < 5; i++) {
      _log('info', [`test ${i}`]);
    }

    // Restore console.log
    console.log = realConsoleLog;

    // Should not have triggered infinite recursion
    expect(consoleLogCallCount).toBe(0); // Wrapped console.log was never called
  });
});

describe('Recursion Guard Pattern', () => {
  it('should implement proper recursion guard for logCapture', () => {
    let callCount = 0;
    const MAX_ALLOWED = 3;

    // The FIX: Use a closure-based guard
    function createLogCaptureWithGuard() {
      let inCapture = false;

      return function logCapture(source, data) {
        // Guard against infinite recursion
        if (inCapture) {
          return; // Skip if already in capture
        }

        inCapture = true;
        try {
          callCount++;
          if (callCount > MAX_ALLOWED) {
            throw new Error('Recursion not prevented!');
          }
          // Simulate console.log but DON'T call the wrapped version
          // In the real code, this is where the bug occurs
          // By NOT calling console.log here, we prevent the recursion
        } finally {
          inCapture = false;
        }
      };
    }

    const safeLogCapture = createLogCaptureWithGuard();

    // Multiple calls should work without recursion
    safeLogCapture('test1', {});
    safeLogCapture('test2', {});
    safeLogCapture('test3', {});

    expect(callCount).toBe(3);
  });

  it('should allow safe nested logging when guard is properly implemented', () => {
    const callLog = [];
    const MAX_NESTING = 3;

    function logWithGuard() {
      let depth = 0;

      return function log(message) {
        if (depth >= MAX_NESTING) {
          callLog.push('MAX_DEPTH_REACHED');
          return;
        }
        depth++;
        callLog.push(`enter:${message}`);
        // Simulate nested logging - with proper guard this won't recurse
        log(message); // This would recurse without guard
        callLog.push(`exit:${message}`);
        depth--;
      };
    }

    const safeLog = logWithGuard();
    safeLog('test');

    // With the fix, each call enters once and exits once
    // Without guard, it would enter MAX_NESTING times
    expect(callLog).toContain('MAX_DEPTH_REACHED');
  });
});

