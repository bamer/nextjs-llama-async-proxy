/**
 * Logger Format Test Scenarios
 */

import type { LoggerConfig } from '@/lib/logger';
import { setupLoggerMocks, mockedCreateLogger } from './logger-mock-transport';

export const initConfigScenarios = {
  testDefaultConfig: () => {
    const { initLogger } = require('@/lib/logger');
    const { mockLoggerInstance } = setupLoggerMocks();
    const result = initLogger();
    expect(mockedCreateLogger).toHaveBeenCalledWith(expect.objectContaining({ level: 'verbose', exitOnError: false }));
    expect(result).toBe(mockLoggerInstance);
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Logger initialized with configuration:', expect.objectContaining({ consoleLevel: 'info', fileLevel: 'info', errorLevel: 'error' }));
  },

  testCustomConfig: () => {
    const { initLogger } = require('@/lib/logger');
    const { mockLoggerInstance } = setupLoggerMocks();
    const customConfig: Partial<LoggerConfig> = { consoleLevel: 'debug', fileLevel: 'debug', maxFileSize: '50m', maxFiles: '14d' };
    const result = initLogger(customConfig);
    expect(result).toBe(mockLoggerInstance);
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Logger initialized with configuration:', expect.objectContaining({ consoleLevel: 'debug', fileLevel: 'debug' }));
  },

  testEmptyConfig: () => {
    const { initLogger } = require('@/lib/logger');
    expect(() => initLogger({})).not.toThrow();
  },
};

export const updateConfigScenarios = {
  testConfigUpdate: () => {
    const { updateLoggerConfig } = require('@/lib/logger');
    const { mockLoggerInstance } = setupLoggerMocks();
    const newConfig: Partial<LoggerConfig> = { consoleLevel: 'debug', enableFileLogging: false };
    updateLoggerConfig(newConfig);
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Updating logger configuration:', newConfig);
  },

  testReinitializationOnConfigChange: () => {
    const { updateLoggerConfig, getLoggerConfig } = require('@/lib/logger');
    updateLoggerConfig({ consoleLevel: 'debug' });
    expect(mockedCreateLogger).toHaveBeenCalled();
    const config = getLoggerConfig();
    expect(config.consoleLevel).toBe('debug');
    expect(config.enableFileLogging).toBe(true);
  },

  testMultipleConfigUpdates: () => {
    const { updateLoggerConfig, getLoggerConfig } = require('@/lib/logger');
    updateLoggerConfig({ consoleLevel: 'debug' });
    updateLoggerConfig({ fileLevel: 'debug' });
    updateLoggerConfig({ enableFileLogging: false });
    const config = getLoggerConfig();
    expect(config.consoleLevel).toBe('debug');
    expect(config.fileLevel).toBe('debug');
    expect(config.enableFileLogging).toBe(false);
  },
};

export const getConfigScenarios = {
  testGetCurrentConfig: () => {
    const { getLoggerConfig } = require('@/lib/logger');
    const config = getLoggerConfig();
    expect(config).toEqual(expect.objectContaining({ consoleLevel: expect.any(String), fileLevel: expect.any(String), errorLevel: expect.any(String), maxFileSize: expect.any(String), maxFiles: expect.any(String), enableFileLogging: expect.any(Boolean), enableConsoleLogging: expect.any(Boolean) }));
  },

  testConfigIsCopy: () => {
    const { getLoggerConfig } = require('@/lib/logger');
    const config1 = getLoggerConfig();
    const config2 = getLoggerConfig();
    expect(config1).not.toBe(config2);
    expect(config1).toEqual(config2);
  },

  testConfigReflectsUpdates: () => {
    const { updateLoggerConfig, getLoggerConfig } = require('@/lib/logger');
    updateLoggerConfig({ consoleLevel: 'debug' });
    expect(getLoggerConfig().consoleLevel).toBe('debug');
  },
};
