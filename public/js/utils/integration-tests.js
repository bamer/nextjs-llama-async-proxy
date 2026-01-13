/**
 * Integration Tests for Real-time Logging System
 * Tests the complete flow: console.log → ClientLogger → Socket.IO → Server → Broadcast → UI Update
 */

class LoggingSystemIntegrationTests {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🧪 Starting Logging System Integration Tests...');

    try {
      // Wait for system to be ready
      await this.waitForSystemReady();

      // Run individual tests
      await this.testClientLoggerInitialization();
      await this.testConsoleOverrides();
      await this.testSocketConnection();
      await this.testLogTransmission();
      await this.testServerBroadcast();
      await this.testUIUpdate();
      await this.testPerformance();

      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.results.errors.push({ test: 'testSuite', error: error.message });
    }
  }

  async waitForSystemReady() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds

      const checkReady = () => {
        attempts++;

        const ready = window.DEBUG_SYSTEM &&
                     window.clientLogger &&
                     window.socketClient &&
                     window.stateManager &&
                     window.socketClient.isConnected;

        if (ready) {
          console.log('✅ System ready for testing');
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('System not ready after 5 seconds'));
        } else {
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    });
  }

  async testClientLoggerInitialization() {
    console.log('🧪 Testing ClientLogger initialization...');

    try {
      this.assert(window.clientLogger, 'ClientLogger exists');
      this.assert(typeof window.clientLogger.init === 'function', 'ClientLogger.init is function');
      this.assert(window.clientLogger.isInitialized, 'ClientLogger is initialized');

      console.log('✅ ClientLogger initialization test passed');
      this.results.passed++;
    } catch (error) {
      console.error('❌ ClientLogger initialization test failed:', error);
      this.results.failed++;
      this.results.errors.push({ test: 'clientLoggerInit', error: error.message });
    }
  }

  async testConsoleOverrides() {
    console.log('🧪 Testing console method overrides...');

    try {
      const originalLog = console.log;
      const originalInfo = console.info;
      const originalWarn = console.warn;
      const originalError = console.error;

      // Check that methods are overridden
      this.assert(console.log !== originalLog, 'console.log is overridden');
      this.assert(console.info !== originalInfo, 'console.info is overridden');
      this.assert(console.warn !== originalWarn, 'console.warn is overridden');
      this.assert(console.error !== originalError, 'console.error is overridden');

      // Test that originals are preserved
      this.assert(typeof window.clientLogger.originalConsole.log === 'function', 'Original console.log preserved');
      this.assert(typeof window.clientLogger.originalConsole.info === 'function', 'Original console.info preserved');
      this.assert(typeof window.clientLogger.originalConsole.warn === 'function', 'Original console.warn preserved');
      this.assert(typeof window.clientLogger.originalConsole.error === 'function', 'Original console.error preserved');

      console.log('✅ Console overrides test passed');
      this.results.passed++;
    } catch (error) {
      console.error('❌ Console overrides test failed:', error);
      this.results.failed++;
      this.results.errors.push({ test: 'consoleOverrides', error: error.message });
    }
  }

  async testSocketConnection() {
    console.log('🧪 Testing Socket.IO connection...');

    try {
      this.assert(window.socketClient, 'SocketClient exists');
      this.assert(window.socketClient.isConnected, 'SocketClient is connected');
      this.assert(window.socketClient.socket, 'Socket.IO socket exists');
      this.assert(window.socketClient.socket.id, 'Socket has valid ID');

      // Test debug system integration
      if (window.DEBUG_SYSTEM?.socket) {
        const stats = window.DEBUG_SYSTEM.socket.getStats();
        this.assert(stats.connected, 'Debug system reports connection');
        this.assert(stats.sent >= 0, 'Debug system has valid sent count');
        this.assert(stats.received >= 0, 'Debug system has valid received count');
      }

      console.log('✅ Socket.IO connection test passed');
      this.results.passed++;
    } catch (error) {
      console.error('❌ Socket.IO connection test failed:', error);
      this.results.failed++;
      this.results.errors.push({ test: 'socketConnection', error: error.message });
    }
  }

  async testLogTransmission() {
    console.log('🧪 Testing log transmission...');

    return new Promise((resolve) => {
      const testMessage = `TEST_LOG_TRANSMISSION_${Date.now()}`;

      // Listen for server response
      const responseHandler = (data) => {
        if (data.data && data.data.message && data.data.message.includes(testMessage)) {
          try {
            this.assert(data.success, 'Server response successful');
            this.assert(data.data.added, 'Server confirms log added');

            // Check debug system
            if (window.DEBUG_SYSTEM?.socket) {
              const stats = window.DEBUG_SYSTEM.socket.getStats();
              this.assert(stats.sent > 0, 'Debug system recorded sent event');
            }

            console.log('✅ Log transmission test passed');
            this.results.passed++;
            resolve();
          } catch (error) {
            console.error('❌ Log transmission test failed:', error);
            this.results.failed++;
            this.results.errors.push({ test: 'logTransmission', error: error.message });
            resolve();
          }
        }
      };

      // Set up listener for server response
      window.socketClient.on('logs:add:result', responseHandler);

      // Send test log
      console.log(testMessage);

      // Timeout after 5 seconds
      setTimeout(() => {
        window.socketClient.off('logs:add:result', responseHandler);
        console.error('❌ Log transmission test failed: timeout');
        this.results.failed++;
        this.results.errors.push({ test: 'logTransmission', error: 'timeout' });
        resolve();
      }, 5000);
    });
  }

  async testServerBroadcast() {
    console.log('🧪 Testing server broadcast...');

    return new Promise((resolve) => {
      const testMessage = `TEST_BROADCAST_${Date.now()}`;
      let broadcastReceived = false;

      // Listen for broadcast
      const broadcastHandler = (data) => {
        if (data && data.data && data.data.message && data.data.message.includes(testMessage)) {
          broadcastReceived = true;
          try {
            this.assert(data.type === 'broadcast', 'Broadcast has correct type');
            this.assert(data.data.message.includes('[CLIENT]'), 'Message has client prefix');
            this.assert(data.data.source === 'client', 'Source is client');

            console.log('✅ Server broadcast test passed');
            this.results.passed++;
            resolve();
          } catch (error) {
            console.error('❌ Server broadcast test failed:', error);
            this.results.failed++;
            this.results.errors.push({ test: 'serverBroadcast', error: error.message });
            resolve();
          }
        }
      };

      // Set up broadcast listener
      window.socketClient.on('logs:new', broadcastHandler);

      // Send test log after a short delay
      setTimeout(() => {
        console.log(testMessage);
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        window.socketClient.off('logs:new', broadcastHandler);
        if (!broadcastReceived) {
          console.error('❌ Server broadcast test failed: no broadcast received');
          this.results.failed++;
          this.results.errors.push({ test: 'serverBroadcast', error: 'no_broadcast' });
        }
        resolve();
      }, 5000);
    });
  }

  async testUIUpdate() {
    console.log('🧪 Testing UI update...');

    return new Promise((resolve) => {
      const testMessage = `TEST_UI_UPDATE_${Date.now()}`;
      let uiUpdated = false;

      // Get initial log count
      const initialLogs = window.stateManager.get('logs') || [];
      const initialCount = initialLogs.length;

      // Monitor state changes
      const unsubscribe = window.stateManager.subscribe('logs', (logs) => {
        const currentLogs = logs || [];
        if (currentLogs.length > initialCount) {
          // Check if our test message is in the logs
          const found = currentLogs.some(log =>
            log.message && log.message.includes(testMessage)
          );

          if (found) {
            uiUpdated = true;
            try {
              this.assert(currentLogs.length === initialCount + 1, 'Log count increased by 1');
              this.assert(found, 'Test message found in logs');

              // Check debug system
              if (window.DEBUG_SYSTEM?.logging) {
                const stats = window.DEBUG_SYSTEM.logging.getStats();
                this.assert(stats.displayed > 0, 'Debug system recorded display event');
              }

              console.log('✅ UI update test passed');
              this.results.passed++;
              unsubscribe();
              resolve();
            } catch (error) {
              console.error('❌ UI update test failed:', error);
              this.results.failed++;
              this.results.errors.push({ test: 'uiUpdate', error: error.message });
              unsubscribe();
              resolve();
            }
          }
        }
      });

      // Send test log
      setTimeout(() => {
        console.log(testMessage);
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        if (!uiUpdated) {
          console.error('❌ UI update test failed: no UI update detected');
          this.results.failed++;
          this.results.errors.push({ test: 'uiUpdate', error: 'no_ui_update' });
        }
        resolve();
      }, 5000);
    });
  }

  async testPerformance() {
    console.log('🧪 Testing performance...');

    try {
      const testRuns = 10;
      const latencies = [];

      for (let i = 0; i < testRuns; i++) {
        const startTime = performance.now();
        console.log(`PERF_TEST_${i}_${Date.now()}`);

        // Wait for UI update
        await new Promise((resolve) => {
          const unsubscribe = window.stateManager.subscribe('logs', (logs) => {
            const found = (logs || []).some(log => log.message && log.message.includes(`PERF_TEST_${i}`));
            if (found) {
              latencies.push(performance.now() - startTime);
              unsubscribe();
              resolve();
            }
          });

          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 1000);
        });
      }

      // Calculate statistics
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      console.log(`📊 Performance Results:`, {
        runs: testRuns,
        avgLatency: `${avgLatency.toFixed(2)}ms`,
        maxLatency: `${maxLatency.toFixed(2)}ms`,
        minLatency: `${minLatency.toFixed(2)}ms`
      });

      // Assert reasonable performance
      this.assert(avgLatency < 200, `Average latency < 200ms (${avgLatency.toFixed(2)}ms)`);
      this.assert(maxLatency < 1000, `Max latency < 1000ms (${maxLatency.toFixed(2)}ms)`);

      console.log('✅ Performance test passed');
      this.results.passed++;
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      this.results.failed++;
      this.results.errors.push({ test: 'performance', error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  printResults() {
    const duration = Date.now() - this.startTime;
    const total = this.results.passed + this.results.failed;

    console.log('\n' + '='.repeat(60));
    console.log('🧪 LOGGING SYSTEM INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Duration: ${duration}ms`);
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Success Rate: ${total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0}%`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.test}: ${err.error}`);
      });
    }

    // Generate debug report
    if (window.DEBUG_SYSTEM) {
      console.log('\n📊 DEBUG SYSTEM REPORT:');
      console.log('Timing:', window.DEBUG_SYSTEM.timing.getReport());
      console.log('Socket Stats:', window.DEBUG_SYSTEM.socket.getStats());
      console.log('Logging Stats:', window.DEBUG_SYSTEM.logging.getStats());
      console.log('Recent Events:', window.DEBUG_SYSTEM.tracer.getEvents().slice(-5));
    }

    console.log('='.repeat(60));

    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Logging system is working correctly.');
    } else {
      console.log('⚠️  SOME TESTS FAILED. Check the errors above.');
    }
  }
}

// Auto-run tests when page loads (after system is ready)
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.location.search.includes('run-tests')) {
      const tests = new LoggingSystemIntegrationTests();
      tests.runAllTests();
    } else {
      console.log('💡 Add ?run-tests to URL to run integration tests');
    }
  }, 2000); // Wait 2 seconds for system to fully initialize
});

// Export for manual testing
window.LoggingSystemIntegrationTests = LoggingSystemIntegrationTests;
console.log('🧪 Logging System Integration Tests loaded. Add ?run-tests to URL to run.');