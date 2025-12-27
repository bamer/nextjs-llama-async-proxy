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
    it('should create an error with code and message', () => {
      const error = new AppError('TEST_CODE', 'Test error message');

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('AppError');
    });

    it('should create an error with default status code 500', () => {
      const error = new AppError('TEST_CODE', 'Test error message');

      expect(error.statusCode).toBe(500);
    });

    it('should allow custom status code', () => {
      const error = new AppError('TEST_CODE', 'Test error message', 400);

      expect(error.statusCode).toBe(400);
    });

    it('should accept details parameter', () => {
      const details = { field: 'test', value: 123 };
      const error = new AppError('TEST_CODE', 'Test error message', 400, details);

      expect(error.details).toEqual(details);
    });

    it('should work without details parameter', () => {
      const error = new AppError('TEST_CODE', 'Test error message');

      expect(error.details).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should inherit from AppError', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have code VALIDATION_ERROR', () => {
      const error = new ValidationError('Invalid input');

      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should have status code 400', () => {
      const error = new ValidationError('Invalid input');

      expect(error.statusCode).toBe(400);
    });

    it('should accept message parameter', () => {
      const error = new ValidationError('Validation failed');

      expect(error.message).toBe('Validation failed');
    });

    it('should accept details parameter', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Invalid email', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should inherit from AppError', () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have code NOT_FOUND', () => {
      const error = new NotFoundError();

      expect(error.code).toBe('NOT_FOUND');
    });

    it('should have status code 404', () => {
      const error = new NotFoundError();

      expect(error.statusCode).toBe(404);
    });

    it('should use default message if not provided', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('Model not found');

      expect(error.message).toBe('Model not found');
    });
  });

  describe('NetworkError', () => {
    it('should inherit from AppError', () => {
      const error = new NetworkError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have code NETWORK_ERROR', () => {
      const error = new NetworkError();

      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should have status code 503', () => {
      const error = new NetworkError();

      expect(error.statusCode).toBe(503);
    });

    it('should use default message if not provided', () => {
      const error = new NetworkError();

      expect(error.message).toBe('Network request failed');
    });

    it('should accept custom message', () => {
      const error = new NetworkError('Connection timeout');

      expect(error.message).toBe('Connection timeout');
    });
  });

  describe('ServerError', () => {
    it('should inherit from AppError', () => {
      const error = new ServerError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have code SERVER_ERROR', () => {
      const error = new ServerError();

      expect(error.code).toBe('SERVER_ERROR');
    });

    it('should have status code 500', () => {
      const error = new ServerError();

      expect(error.statusCode).toBe(500);
    });

    it('should use default message if not provided', () => {
      const error = new ServerError();

      expect(error.message).toBe('Internal server error');
    });

    it('should accept custom message', () => {
      const error = new ServerError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
    });
  });

  describe('handleError', () => {
    it('should return AppError unchanged', () => {
      const originalError = new ValidationError('Test error');
      const result = handleError(originalError);

      expect(result).toBe(originalError);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should convert network error message to NetworkError', () => {
      const error = new Error('Network request failed');
      const result = handleError(error);

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toBe('Network request failed');
    });

    it('should convert fetch error message to NetworkError', () => {
      const error = new Error('Fetch failed');
      const result = handleError(error);

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('should convert not found error message to NotFoundError', () => {
      const error = new Error('Resource not found');
      const result = handleError(error);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should convert 404 error message to NotFoundError', () => {
      const error = new Error('404 Not Found');
      const result = handleError(error);

      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should convert validation error message to ValidationError', () => {
      const error = new Error('Validation failed');
      const result = handleError(error);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should convert invalid error message to ValidationError', () => {
      const error = new Error('Invalid input');
      const result = handleError(error);

      expect(result).toBeInstanceOf(ValidationError);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should convert other Error to ServerError', () => {
      const error = new Error('Some random error');
      const result = handleError(error);

      expect(result).toBeInstanceOf(ServerError);
      expect(result.code).toBe('SERVER_ERROR');
      expect(result.message).toBe('Some random error');
    });

    it('should convert non-Error value to AppError', () => {
      const result = handleError('string error');

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('string error');
    });

    it('should convert null to AppError', () => {
      const result = handleError(null);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('null');
    });

    it('should convert undefined to AppError', () => {
      const result = handleError(undefined);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('undefined');
    });

    it('should convert number to AppError', () => {
      const result = handleError(12345);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('12345');
    });

    it('should convert object to AppError', () => {
      const obj = { error: 'test', code: 500 };
      const result = handleError(obj);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('[object Object]');
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError', () => {
      const error = new AppError('TEST', 'Test');

      expect(isAppError(error)).toBe(true);
    });

    it('should return true for ValidationError', () => {
      const error = new ValidationError('Test');

      expect(isAppError(error)).toBe(true);
    });

    it('should return true for NotFoundError', () => {
      const error = new NotFoundError();

      expect(isAppError(error)).toBe(true);
    });

    it('should return true for NetworkError', () => {
      const error = new NetworkError();

      expect(isAppError(error)).toBe(true);
    });

    it('should return true for ServerError', () => {
      const error = new ServerError();

      expect(isAppError(error)).toBe(true);
    });

    it('should return false for standard Error', () => {
      const error = new Error('Test');

      expect(isAppError(error)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isAppError('error')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAppError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAppError(undefined)).toBe(false);
    });

    it('should return false for object', () => {
      expect(isAppError({ error: 'test' })).toBe(false);
    });
  });

  describe('logError', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log AppError with code and message', () => {
      const error = new AppError('TEST_CODE', 'Test error message');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[TEST_CODE] Test error message', '');
    });

    it('should log AppError with details', () => {
      const details = { field: 'test', value: 123 };
      const error = new AppError('TEST_CODE', 'Test error message', 400, details);
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[TEST_CODE] Test error message', details);
    });

    it('should log Error converted to AppError', () => {
      const error = new Error('Test error');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[SERVER_ERROR] Test error', '');
    });

    it('should log with context prefix', () => {
      const error = new AppError('TEST_CODE', 'Test error message');
      logError(error, 'MyContext');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[TEST_CODE] MyContext: Test error message', '');
    });

    it('should log with context and details', () => {
      const details = { field: 'test' };
      const error = new AppError('TEST_CODE', 'Test error message', 400, details);
      logError(error, 'MyContext');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[TEST_CODE] MyContext: Test error message', details);
    });

    it('should log non-Error values', () => {
      logError('string error', 'TestContext');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[UNKNOWN_ERROR] TestContext: string error', '');
    });

    it('should log NetworkError with code', () => {
      const error = new NetworkError('Connection failed');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[NETWORK_ERROR] Connection failed', '');
    });

    it('should log ValidationError with code', () => {
      const error = new ValidationError('Invalid data');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[VALIDATION_ERROR] Invalid data', '');
    });

    it('should log NotFoundError with code', () => {
      const error = new NotFoundError('Resource missing');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[NOT_FOUND] Resource missing', '');
    });

    it('should log ServerError with code', () => {
      const error = new ServerError('System failure');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[SERVER_ERROR] System failure', '');
    });
  });
});
