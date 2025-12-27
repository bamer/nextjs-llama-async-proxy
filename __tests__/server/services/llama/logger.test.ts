import { Logger } from '@/server/services/llama/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger('TestService');
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create logger with default name', () => {
      const defaultLogger = new Logger();
      const message = 'test';
      defaultLogger.info(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LlamaService]')
      );
    });

    it('should create logger with custom name', () => {
      logger = new Logger('CustomService');
      const message = 'test';
      logger.info(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CustomService]')
      );
    });
  });

  describe('log', () => {
    it('should format log message with timestamp and prefix', () => {
      const message = 'Test message';
      logger.log('info', message);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T.*\] \[TestService\] Test message$/)
      );
    });

    it('should call console.log for info level', () => {
      logger.log('info', 'Info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should call console.warn for warn level', () => {
      logger.log('warn', 'Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should call console.error for error level', () => {
      logger.log('error', 'Error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should call console.debug for debug level', () => {
      logger.log('debug', 'Debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      const message = 'Info message';
      logger.info(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestService]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Info message')
      );
    });

    it('should include timestamp', () => {
      logger.info('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.*\]/)
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      const message = 'Warning message';
      logger.warn(message);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestService]')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message')
      );
    });

    it('should include timestamp', () => {
      logger.warn('Test');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.*\]/)
      );
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      const message = 'Error message';
      logger.error(message);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestService]')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      );
    });

    it('should include timestamp', () => {
      logger.error('Test');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.*\]/)
      );
    });

    it('should handle error objects', () => {
      const error = new Error('Test error');
      logger.error(error.message);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      const message = 'Debug message';
      logger.debug(message);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestService]')
      );
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug message')
      );
    });

    it('should include timestamp', () => {
      logger.debug('Test');

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.*\]/)
      );
    });
  });

  describe('message formatting', () => {
    it('should handle empty messages', () => {
      logger.info('');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T.*\] \[TestService\] $/)
      );
    });

    it('should handle multiline messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      logger.info(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Line 1')
      );
    });

    it('should handle special characters', () => {
      const message = 'Test with "quotes" and \'apostrophes\'';
      logger.info(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test with "quotes" and \'apostrophes\'')
      );
    });

    it('should handle emoji', () => {
      const message = 'Test ✅ message';
      logger.info(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅')
      );
    });
  });

  describe('multiple loggers', () => {
    it('should maintain separate prefixes for different loggers', () => {
      const logger1 = new Logger('Service1');
      const logger2 = new Logger('Service2');

      logger1.info('Message 1');
      logger2.info('Message 2');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Service1]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Service2]')
      );
    });
  });

  describe('timestamp format', () => {
    it('should use ISO 8601 format', () => {
      logger.info('Test');

      const calls = consoleLogSpy.mock.calls;
      const logMessage = calls[0][0] as string;
      const timestampMatch = logMessage.match(/\[(.*?)\]/);

      expect(timestampMatch).toBeTruthy();
      const timestamp = timestampMatch![1];

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
