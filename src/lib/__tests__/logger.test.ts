/**
 * Logger Tests
 * Main test file for logger functionality
 */
import type { LoggerConfig } from '@/lib/logger';
import { setupLoggerMocks, createMockLoggerInstance, createMockSocketIO } from './logger-mock-transport';
import { consoleTransportScenarios, fileTransportScenarios, handlerScenarios } from './logger-transport.scenarios';
import { initConfigScenarios, updateConfigScenarios, getConfigScenarios } from './logger-format.scenarios';
describe('Logger', () => {
  let mockLoggerInstance: any;
  let mockSocketIO: any;
  const { mockedCreateLogger } = require('./logger-mock-transport');
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggerInstance = createMockLoggerInstance();
    mockSocketIO = createMockSocketIO();
    mockedCreateLogger.mockReturnValue(mockLoggerInstance);
  });
  describe('initLogger', () => {
    it('initializes logger with default configuration', initConfigScenarios.testDefaultConfig);
    it('initializes logger with custom configuration', initConfigScenarios.testCustomConfig);
    it('adds console transport when enabled', consoleTransportScenarios.testEnabled);
    it('does not add console transport when disabled', consoleTransportScenarios.testDisabled);
    it('adds file transports when enabled', fileTransportScenarios.testEnabled);
    it('does not add file transports when disabled', fileTransportScenarios.testDisabled);
    it('configures application log file transport correctly', fileTransportScenarios.testApplicationLogConfig);
    it('configures error log file transport correctly', fileTransportScenarios.testErrorLogConfig);
    it('sets up exception handling', handlerScenarios.testExceptionHandler);
    it('sets up rejection handling', handlerScenarios.testRejectionHandler);
    it('handles missing exception handler gracefully', handlerScenarios.testMissingExceptionHandler);
    it('handles missing rejection handler gracefully', handlerScenarios.testMissingRejectionHandler);
  });
  describe('updateLoggerConfig', () => {
    it('updates logger configuration', () => {
      const { updateLoggerConfig } = require('@/lib/logger');
      const newConfig: Partial<LoggerConfig> = { consoleLevel: 'debug', enableFileLogging: false };
      updateLoggerConfig(newConfig);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Updating logger configuration:', newConfig);
    });
    it('reinitializes logger when config changes', () => {
      const { updateLoggerConfig, getLoggerConfig } = require('@/lib/logger');
      updateLoggerConfig({ consoleLevel: 'debug' });
      expect(mockedCreateLogger).toHaveBeenCalled();
      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
      expect(config.enableFileLogging).toBe(true);
    });
    it('merges partial config with existing config', () => {
      const { updateLoggerConfig, getLoggerConfig } = require('@/lib/logger');
      updateLoggerConfig({ consoleLevel: 'debug' });
      expect(mockedCreateLogger).toHaveBeenCalled();
      const config = getLoggerConfig();
      expect(config.consoleLevel).toBe('debug');
      expect(config.enableFileLogging).toBe(true);
    });
  });
  describe('getLoggerConfig', () => {
    it('returns current logger configuration', getConfigScenarios.testGetCurrentConfig);
    it('returns a copy of config to prevent mutation', getConfigScenarios.testConfigIsCopy);
    it('reflects updated configuration', getConfigScenarios.testConfigReflectsUpdates);
  });
  describe('getLogger', () => {
    it('returns logger instance', () => expect(require('@/lib/logger').getLogger()).toBe(mockLoggerInstance));
    it('creates logger instance if not exists', () => {
      const logger = require('@/lib/logger').getLogger();
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });
    it('returns same instance on multiple calls', () => expect(require('@/lib/logger').getLogger()).toBe(require('@/lib/logger').getLogger()));
  });
  describe('setSocketIOInstance', () => {
    it('sets Socket.IO instance on WebSocket transport', () => {
      const { initLogger, setSocketIOInstance, getWebSocketTransport } = require('@/lib/logger');
      initLogger();
      const wsTransport = getWebSocketTransport();
      const setSocketIOInstanceMock = jest.fn();
      (wsTransport as any).setSocketIOInstance = setSocketIOInstanceMock;
      setSocketIOInstance(mockSocketIO);
      expect(setSocketIOInstanceMock).toHaveBeenCalledWith(mockSocketIO);
    });
    it('handles null WebSocket transport gracefully', () => {
      expect(() => require('@/lib/logger').setSocketIOInstance(mockSocketIO)).not.toThrow();
    });
  });
  describe('getWebSocketTransport', () => {
    it('returns WebSocket transport instance', () => {
      const { initLogger, getWebSocketTransport } = require('@/lib/logger');
      initLogger();
      const transport = getWebSocketTransport();
      expect(transport).toBeDefined();
      expect(transport).toBeInstanceOf(require('@/lib/websocket-transport').WebSocketTransport);
    });
    it('returns same instance on multiple calls', () => {
      const { initLogger, getWebSocketTransport } = require('@/lib/logger');
      initLogger();
      expect(getWebSocketTransport()).toBe(getWebSocketTransport());
    });
  });
  describe('log object', () => {
    const testLogMethod = (method: string, msg: string, meta?: any) => {
      const { log } = require('@/lib/logger');
      (log[method] as any)(msg, meta);
      expect(mockLoggerInstance[method]).toHaveBeenCalledWith(msg, meta);
    };
    it('provides error logging method', () => testLogMethod('error', 'Test error message', { key: 'value' }));
    it('provides warn logging method', () => testLogMethod('warn', 'Test warning message', { key: 'value' }));
    it('provides info logging method', () => testLogMethod('info', 'Test info message', { key: 'value' }));
    it('provides debug logging method', () => testLogMethod('debug', 'Test debug message', { key: 'value' }));
    it('provides verbose logging method', () => testLogMethod('verbose', 'Test verbose message', { key: 'value' }));
    it('handles log messages without metadata', () => testLogMethod('info', 'Simple message'));
    it('handles complex metadata objects', () => testLogMethod('info', 'Complex metadata', { nested: { key: 'value' }, array: [1, 2, 3], number: 42, boolean: true }));
  });
  describe('LoggerConfig interface', () => {
    it('accepts valid configuration values', () => {
      const { initLogger } = require('@/lib/logger');
      const config: LoggerConfig = { consoleLevel: 'debug', fileLevel: 'info', errorLevel: 'error', maxFileSize: '20m', maxFiles: '30d', enableFileLogging: true, enableConsoleLogging: true };
      expect(() => initLogger(config)).not.toThrow();
    });
    it('accepts all valid log levels', () => {
      const { initLogger } = require('@/lib/logger');
      const levels: Array<'error' | 'info' | 'warn' | 'debug'> = ['error', 'info', 'warn', 'debug'];
      levels.forEach((level) => expect(() => initLogger({ consoleLevel: level } as Partial<LoggerConfig>)).not.toThrow());
    });
    it('accepts valid error levels', () => {
      const { initLogger } = require('@/lib/logger');
      const levels: Array<'error' | 'warn'> = ['error', 'warn'];
      levels.forEach((level) => expect(() => initLogger({ errorLevel: level } as Partial<LoggerConfig>)).not.toThrow());
    });
  });
  describe('Edge cases', () => {
    it('handles empty config object', initConfigScenarios.testEmptyConfig);
    it('handles multiple config updates', updateConfigScenarios.testMultipleConfigUpdates);
    it('handles rapid consecutive log calls', () => {
      const { log } = require('@/lib/logger');
      for (let i = 0; i < 100; i++) log.info(`Message ${i}`);
      expect(mockLoggerInstance.info).toHaveBeenCalledTimes(100);
    });
    it('handles logging with undefined metadata', () => {
      const { log } = require('@/lib/logger');
      log.info('Message', undefined as any);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Message', undefined);
    });
    it('handles logging with null metadata', () => {
      const { log } = require('@/lib/logger');
      log.info('Message', null as any);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Message', null);
    });
    it('handles special characters in log messages', () => {
      const { log } = require('@/lib/logger');
      const specialChars = 'Test \n\t\r\f\b message with "quotes" and \'apostrophes\'';
      log.info(specialChars);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith(specialChars);
    });
    it('handles very long log messages', () => {
      const { log } = require('@/lib/logger');
      const longMessage = 'x'.repeat(10000);
      log.info(longMessage);
      expect(mockLoggerInstance.info).toHaveBeenCalledWith(longMessage);
    });
  });
  describe('Error handling', () => {
    it('handles logging errors gracefully', () => {
      const { log } = require('@/lib/logger');
      mockLoggerInstance.error.mockImplementation(() => { throw new Error('Logging failed'); });
      expect(() => log.error('Test')).not.toThrow();
    });
    it('handles config update errors gracefully', () => {
      const { updateLoggerConfig } = require('@/lib/logger');
      mockedCreateLogger.mockImplementation(() => { throw new Error('Logger creation failed'); });
      expect(() => updateLoggerConfig({ consoleLevel: 'debug' })).not.toThrow();
    });
  });
  describe('Type safety', () => {
    it('enforces LoggerConfig type', () => {
      const config: Partial<LoggerConfig> = { consoleLevel: 'debug' };
      expect(config.consoleLevel).toBeDefined();
    });
    it('allows all LoggerConfig properties to be optional', () => {
      const { initLogger } = require('@/lib/logger');
      const config: Partial<LoggerConfig> = {};
      expect(() => initLogger(config)).not.toThrow();
    });
  });
});
