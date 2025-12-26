import { Logger } from '@/server/services/llama/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

    logger = new Logger('TestLogger');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with name', () => {
      const testLogger = new Logger('TestName');

      expect(testLogger).toBeInstanceOf(Logger);
    });
  });

  describe('info', () => {
    it('should log info messages to console', () => {
      logger.info('Test info message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger]'),
        'Test info message'
      );
    });

    it('should log info with metadata', () => {
      const meta = { key: 'value' };
      logger.info('Test message', meta);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger]'),
        'Test message',
        meta
      );
    });

    it('should format timestamp in info messages', () => {
      logger.info('Test message');

      const calls = consoleLogSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('warn', () => {
    it('should log warning messages to console', () => {
      logger.warn('Test warning');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger]'),
        'Test warning'
      );
    });

    it('should log warning with metadata', () => {
      const meta = { warning: 'details' };
      logger.warn('Test message', meta);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger]'),
        'Test message',
        meta
      );
    });
  });

  describe('error', () => {
    it('should log error messages to console', () => {
      logger.error('Test error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger]'),
        'Test error'
      );
    });

    it('should log error with metadata', () => {
      const meta = { errorCode: 500 };
      logger.error('Test message', meta);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger]'),
        'Test message',
        meta
      );
    });
  });

  describe('debug', () => {
    it('should log debug messages to console', () => {
      logger.debug('Test debug message');

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger]'),
        'Test debug message'
      );
    });

    it('should log debug with metadata', () => {
      const meta = { debug: 'info' };
      logger.debug('Test message', meta);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestLogger]'),
        'Test message',
        meta
      );
    });
  });

  describe('message formatting', () => {
    it('should include logger name in all messages', () => {
      logger.info('Test');
      logger.warn('Test');
      logger.error('Test');
      logger.debug('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[TestLogger]'), expect.any(String));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[TestLogger]'), expect.any(String));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[TestLogger]'), expect.any(String));
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('[TestLogger]'), expect.any(String));
    });

    it('should include level in formatted messages', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(String), 'info', 'Test message');
    });
  });

  describe('type safety', () => {
    it('should have correct method signatures', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should handle optional metadata parameter', () => {
      logger.info('Test');
      logger.info('Test with meta', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });
});
