import { type LoggerConfig } from '@/lib/logger';
import winston from 'winston';
import { createMockLogger, initLogger, getLoggerConfig, updateLoggerConfig } from './logger.test-utils';

jest.mock('winston');

describe('Logger Configuration', () => {
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
  });

  it('should update logger configuration', () => {
    const newConfig: Partial<LoggerConfig> = {
      consoleLevel: 'debug',
      fileLevel: 'error',
    };

    updateLoggerConfig(newConfig);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Updating logger configuration:',
      newConfig
    );
  });

  it('should return current config', () => {
    initLogger({ consoleLevel: 'debug' });
    const config = getLoggerConfig();
    expect(config).toEqual(
      expect.objectContaining({
        consoleLevel: 'debug',
      })
    );
  });

  it('should return a copy of config', () => {
    initLogger();
    const config1 = getLoggerConfig();
    const config2 = getLoggerConfig();
    expect(config1).not.toBe(config2);
    expect(config1).toEqual(config2);
  });
});
