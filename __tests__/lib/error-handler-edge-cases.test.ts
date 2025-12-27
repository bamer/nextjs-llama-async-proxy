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

describe('error-handler additional edge cases', () => {
  describe('AppError', () => {
    // Positive: Test with all parameters including details
    it('should create AppError with all parameters', () => {
      const error = new AppError('TEST_ERROR', 'Test message', 418, { detail: 'value' });

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(418);
      expect((error.details as any)).toEqual({ detail: 'value' });
      expect(error.name).toBe('AppError');
    });

    // Negative: Test with undefined message
    it('should handle undefined message', () => {
      const error = new AppError('TEST_ERROR', undefined as any);

      // Error constructor converts undefined to empty string
      expect(error.message).toBe('');
      expect(error.code).toBe('TEST_ERROR');
    });

    // Negative: Test with null message
    it('should handle null message', () => {
      const error = new AppError('TEST_ERROR', null as any);

      // Error constructor converts null to string "null"
      expect(error.message).toBe('null');
      expect(error.code).toBe('TEST_ERROR');
    });

    // Negative: Test with invalid statusCode
    it('should handle negative statusCode', () => {
      const error = new AppError('TEST_ERROR', 'Test', -1);

      expect(error.statusCode).toBe(-1);
    });

    // Negative: Test with very large statusCode
    it('should handle very large statusCode', () => {
      const error = new AppError('TEST_ERROR', 'Test', 9999);

      expect(error.statusCode).toBe(9999);
    });

    // Edge case: Test with empty details object
    it('should handle empty details object', () => {
      const error = new AppError('TEST_ERROR', 'Test', 500, {});

      expect(error.details).toEqual({});
    });

    // Edge case: Test with nested details
    it('should handle nested details', () => {
      const details = {
        level1: {
          level2: {
            level3: 'deep value'
          }
        },
        array: [1, 2, 3]
      };
      const error = new AppError('TEST_ERROR', 'Test', 500, details);

      expect(error.details).toEqual(details);
    });

    // Edge case: Test with function in details
    it('should handle function in details', () => {
      const fn = () => 'test';
      const error = new AppError('TEST_ERROR', 'Test', 500, { callback: fn });

      expect((error.details as any).callback).toBe(fn);
    });
  });

  describe('ValidationError', () => {
    // Positive: Test with all properties
    it('should create ValidationError with all properties', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = new ValidationError('Invalid email format', details);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid email format');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });

    // Negative: Test with empty message
    it('should handle empty message', () => {
      const error = new ValidationError('');

      expect(error.message).toBe('');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    // Edge case: Test with array details
    it('should handle array details', () => {
      const details = ['error1', 'error2'];
      const error = new ValidationError('Multiple errors', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    // Positive: Test with custom message
    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });

    // Edge case: Test with empty message
    it('should handle empty custom message', () => {
      const error = new NotFoundError('');

      expect(error.message).toBe('');
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('NetworkError', () => {
    // Positive: Test with custom message
    it('should create NetworkError with custom message', () => {
      const error = new NetworkError('Connection timeout');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Connection timeout');
      expect(error.statusCode).toBe(503);
    });
  });

  describe('ServerError', () => {
    // Positive: Test with custom message
    it('should create ServerError with custom message', () => {
      const error = new ServerError('Database connection failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('handleError', () => {
    // Positive: Test case-insensitive keyword matching
    it('should match keywords case-insensitively for network errors', () => {
      const error1 = handleError(new Error('NETWORK failed'));
      const error2 = handleError(new Error('Network FAILED'));
      const error3 = handleError(new Error('network error'));

      expect(error1).toBeInstanceOf(NetworkError);
      expect(error2).toBeInstanceOf(NetworkError);
      expect(error3).toBeInstanceOf(NetworkError);
    });

    it('should match keywords case-insensitively for validation errors', () => {
      const error1 = handleError(new Error('VALIDATION failed'));
      const error2 = handleError(new Error('Validation FAILED'));
      const error3 = handleError(new Error('validation error'));

      expect(error1).toBeInstanceOf(ValidationError);
      expect(error2).toBeInstanceOf(ValidationError);
      expect(error3).toBeInstanceOf(ValidationError);
    });

    // Edge case: Test with Error containing multiple keywords
    it('should handle error with multiple keywords', () => {
      const error = handleError(new Error('Network validation failed'));

      // Should match first matching condition (network)
      expect(error).toBeInstanceOf(NetworkError);
    });

    // Negative: Test with undefined value
    it('should handle undefined', () => {
      const error = handleError(undefined);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('undefined');
    });

    // Negative: Test with object
    it('should handle plain object', () => {
      const error = handleError({ code: 'ECONNREFUSED', message: 'Connection refused' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('[object Object]');
    });

    // Negative: Test with array
    it('should handle array', () => {
      const error = handleError(['error1', 'error2']);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('UNKNOWN_ERROR');
    });

    // Edge case: Test with boolean true
    it('should handle boolean true', () => {
      const error = handleError(true);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('true');
    });

    // Edge case: Test with boolean false
    it('should handle boolean false', () => {
      const error = handleError(false);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('false');
    });

    // Edge case: Test with number
    it('should handle number', () => {
      const error = handleError(404);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('404');
    });

    // Edge case: Test with float number
    it('should handle float number', () => {
      const error = handleError(404.5);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('404.5');
    });

    // Edge case: Test with Infinity
    it('should handle Infinity', () => {
      const error = handleError(Infinity);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Infinity');
    });

    // Edge case: Test with NaN
    it('should handle NaN', () => {
      const error = handleError(NaN);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('NaN');
    });

    // Edge case: Test with empty string
    it('should handle empty string', () => {
      const error = handleError('');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.message).toBe('');
    });

    // Edge case: Test with very long string
    it('should handle very long string', () => {
      const longString = 'x'.repeat(10000);
      const error = handleError(longString);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(longString);
    });

    // Edge case: Test with Error subclass that isn't AppError
    it('should handle Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = handleError(new CustomError('Custom error'));

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('Custom error');
    });
  });

  describe('isAppError', () => {
    // Edge case: Test with object that has similar properties but isn't AppError
    it('should return false for error-like object', () => {
      const errorLike = {
        code: 'TEST',
        message: 'test',
        statusCode: 500,
        name: 'AppError'
      };

      expect(isAppError(errorLike)).toBe(false);
    });

    // Edge case: Test with null prototype object
    it('should return false for null prototype object', () => {
      const error = Object.create(null);
      (error as any).code = 'TEST';

      expect(isAppError(error)).toBe(false);
    });

    // Edge case: Test with AppError instance from different module
    it('should return true for imported AppError instance', () => {
      const error = new ValidationError('test');

      expect(isAppError(error)).toBe(true);
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

    // Positive: Test with AppError and context
    it('should log AppError with context', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      logError(error, 'Module initialization');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TEST_ERROR] Module initialization: Test message',
        ''
      );
    });

    // Positive: Test with ValidationError and details
    it('should log ValidationError with details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Invalid email', details);
      logError(error, 'User registration');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[VALIDATION_ERROR] User registration: Invalid email',
        details
      );
    });

    // Positive: Test with context and details
    it('should log with both context and details', () => {
      const details = { userId: 123, action: 'delete' };
      const error = new AppError('NOT_FOUND', 'Resource not found', 404, details);
      logError(error, 'API endpoint: /api/users/123');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[NOT_FOUND] API endpoint: /api/users/123: Resource not found',
        details
      );
    });

    // Negative: Test with null error
    it('should handle null error', () => {
      logError(null, 'Context');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    // Negative: Test with undefined error
    it('should handle undefined error', () => {
      logError(undefined, 'Context');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    // Edge case: Test with empty context
    it('should handle empty context string', () => {
      const error = new AppError('TEST', 'message');
      logError(error, '');

      // Empty context doesn't add ": " prefix
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TEST] message',
        ''
      );
    });

    // Edge case: Test with whitespace context
    it('should handle whitespace-only context', () => {
      const error = new AppError('TEST', 'message');
      logError(error, '   ');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TEST]    : message',
        ''
      );
    });

    // Edge case: Test with very long context
    it('should handle very long context', () => {
      const error = new AppError('TEST', 'message');
      const longContext = 'x'.repeat(1000);
      logError(error, longContext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[TEST] ${longContext}: message`,
        ''
      );
    });

    // Edge case: Test with Error that has stack
    it('should log Error with stack', () => {
      const error = new Error('Test');
      error.stack = 'Error: Test\n    at test.js:1:1';

      logError(error, 'Test context');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test context: Test'),
        expect.anything()
      );
    });

    // Edge case: Test with circular reference in details
    it('should handle circular references in details', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      const error = new AppError('TEST', 'message', 500, circular);

      logError(error, 'context');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    // Edge case: Test with no context
    it('should handle no context parameter', () => {
      const error = new AppError('TEST', 'message');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TEST] message',
        ''
      );
    });
  });
});
