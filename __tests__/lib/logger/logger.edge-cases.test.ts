import winston from 'winston';
import { createMockLogger, initLogger } from './logger.test-utils';

jest.mock('winston');

describe('Logger Edge Cases', () => {
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
  });

  it('should handle null config values', () => {
    const config = {
      consoleLevel: null,
      fileLevel: null,
    } as any;
    expect(() => initLogger(config)).not.toThrow();
  });

  it('should handle undefined config values', () => {
    const config = {
      consoleLevel: undefined,
      fileLevel: undefined,
    } as any;
    expect(() => initLogger(config)).not.toThrow();
  });

  it('should handle empty config object', () => {
    expect(() => initLogger({})).not.toThrow();
  });

  it('should handle invalid log level gracefully', () => {
    const config = {
      consoleLevel: 'invalid' as any,
    };
    expect(() => initLogger(config)).not.toThrow();
  });

  it('should handle very long log messages', () => {
    initLogger();
    const longMessage = 'x'.repeat(1000000);
    expect(() => mockLogger.info(longMessage)).not.toThrow();
  });

  it('should handle unicode in log messages', () => {
    initLogger();
    const unicodeMessage = 'Hello 世界 🌍 🚀';
    expect(() => mockLogger.info(unicodeMessage)).not.toThrow();
  });
});
