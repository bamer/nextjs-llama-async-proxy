import {
  AppError,
  ValidationError,
  NotFoundError,
  NetworkError,
  ServerError,
  handleError,
  isAppError,
  logError,
} from '@/lib/error-handler';

describe('error-handler', () => {
  describe('AppError', () => {
    it('should create an AppError with code and message', () => {
      const error = new AppError('TEST_ERROR', 'Test error message');

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('AppError');
    });

    it('should set default statusCode to 500', () => {
      const error = new AppError('TEST_ERROR', 'Test error');

      expect(error.statusCode).toBe(500);
    });

    it('should accept custom statusCode', () => {
      const error = new AppError('TEST_ERROR', 'Test error', 400);

      expect(error.statusCode).toBe(400);
    });

    it('should accept details', () => {
      const details = { field: 'value', count: 10 };
      const error = new AppError('TEST_ERROR', 'Test error', 500, details);

      expect(error.details).toEqual(details);
    });

    it('should have proper stack trace', () => {
      const error = new AppError('TEST_ERROR', 'Test error');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
    });

    it('should accept details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Invalid input', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError('Resource not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should have default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
    });
  });

  describe('NetworkError', () => {
    it('should create NetworkError with 503 status', () => {
      const error = new NetworkError('Network failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Network failed');
      expect(error.statusCode).toBe(503);
    });

    it('should have default message', () => {
      const error = new NetworkError();

      expect(error.message).toBe('Network request failed');
    });
  });

  describe('ServerError', () => {
    it('should create ServerError with 500 status', () => {
      const error = new ServerError('Server crashed');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.message).toBe('Server crashed');
      expect(error.statusCode).toBe(500);
    });

    it('should have default message', () => {
      const error = new ServerError();

      expect(error.message).toBe('Internal server error');
    });
  });

  describe('handleError', () => {
    it('should return AppError as-is', () => {
      const originalError = new ValidationError('Test error');
      const handled = handleError(originalError);

      expect(handled).toBe(originalError);
      expect(handled).toBeInstanceOf(ValidationError);
    });

    it('should convert generic Error to ServerError', () => {
      const originalError = new Error('Something went wrong');
      const handled = handleError(originalError);

      expect(handled).toBeInstanceOf(ServerError);
      expect(handled.message).toBe('Something went wrong');
    });

    it('should convert Error with "network" to NetworkError', () => {
      const originalError = new Error('Network connection failed');
      const handled = handleError(originalError);

      expect(handled).toBeInstanceOf(NetworkError);
      expect(handled.message).toBe('Network connection failed');
    });

    it('should convert Error with "fetch" to NetworkError', () => {
      const originalError = new Error('fetch failed');
      const handled = handleError(originalError);

      expect(handled).toBeInstanceOf(NetworkError);
    });

    it('should convert Error with "not found" to NotFoundError', () => {
      const originalError = new Error('User not found');
      const handled = handleError(originalError);

      expect(handled).toBeInstanceOf(NotFoundError);
      expect(handled.message).toBe('User not found');
    });

    it('should convert Error with "404" to NotFoundError', () => {
      const originalError = new Error('404 Not Found');
      const handled = handleError(originalError);

      expect(handled).toBeInstanceOf(NotFoundError);
    });

    it('should convert Error with "validation" to ValidationError', () => {
      const originalError = new Error('Validation failed');
      const handled = handleError(originalError);

      expect(handled).toBeInstanceOf(ValidationError);
      expect(handled.message).toBe('Validation failed');
    });

    it('should convert Error with "invalid" to ValidationError', () => {
      const originalError = new Error('Invalid token');
      const handled = handleError(originalError);

      expect(handled).toBeInstanceOf(ValidationError);
    });

    it('should convert non-Error to AppError', () => {
      const handled = handleError('string error');

      expect(handled).toBeInstanceOf(AppError);
      expect(handled.code).toBe('UNKNOWN_ERROR');
      expect(handled.message).toBe('string error');
    });

    it('should convert null to AppError', () => {
      const handled = handleError(null);

      expect(handled).toBeInstanceOf(AppError);
      expect(handled.code).toBe('UNKNOWN_ERROR');
    });

    it('should convert number to AppError', () => {
      const handled = handleError(404);

      expect(handled).toBeInstanceOf(AppError);
      expect(handled.code).toBe('UNKNOWN_ERROR');
      expect(handled.message).toBe('404');
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError', () => {
      const error = new AppError('TEST', 'test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return true for ValidationError', () => {
      const error = new ValidationError('test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return true for NotFoundError', () => {
      const error = new NotFoundError('test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return true for NetworkError', () => {
      const error = new NetworkError('test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return true for ServerError', () => {
      const error = new ServerError('test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for generic Error', () => {
      const error = new Error('test');
      expect(isAppError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAppError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAppError(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isAppError('error')).toBe(false);
    });

    it('should narrow type in TypeScript', () => {
      const error: unknown = new ValidationError('test');
      if (isAppError(error)) {
        expect(error.code).toBeDefined();
        expect(error.statusCode).toBeDefined();
      }
    });
  });

  describe('logError', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log AppError with code and message', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TEST_ERROR] Test message',
        ''
      );
    });

    it('should log with context', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      logError(error, 'API call');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TEST_ERROR] API call: Test message',
        ''
      );
    });

    it('should log with details', () => {
      const details = { userId: 123, action: 'update' };
      const error = new AppError('TEST_ERROR', 'Test message', 500, details);
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TEST_ERROR] Test message',
        details
      );
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generic error'),
        expect.anything()
      );
    });

    it('should handle non-Error', () => {
      logError('string error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
    });
  });
});
