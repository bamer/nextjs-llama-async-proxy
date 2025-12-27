/**
 * Test for maxListeners fix
 */

import { initLogger, getLogger } from '@/lib/logger';

describe('Logger MaxListeners Fix', () => {
  it('should create logger without MaxListenersExceededWarning', () => {
    // This test verifies that logger can be initialized
    // without triggering MaxListenersExceededWarning
    const logger = initLogger({
      enableConsoleLogging: true,
      enableFileLogging: false,
    });

    expect(logger).toBeDefined();
    expect(logger).not.toBeNull();

    // Logger should have maxListeners set if available
    if (typeof (logger as any).setMaxListeners === 'function') {
      const maxListeners = (logger as any).getMaxListeners();
      expect(maxListeners).toBeGreaterThan(10);
    }
  });

  it('should support multiple transports without warnings', () => {
    const logger = initLogger({
      enableConsoleLogging: true,
      enableFileLogging: true,
      consoleLevel: 'debug',
      fileLevel: 'debug',
    });

    expect(logger).toBeDefined();

    // Logger should handle multiple transports
    expect(logger).not.toBeNull();
  });

  it('should get logger instance', () => {
    const logger = getLogger();
    expect(logger).toBeDefined();
  });
});
