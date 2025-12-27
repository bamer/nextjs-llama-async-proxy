import {
  AppError,
  ValidationError,
  NotFoundError,
  NetworkError,
  ServerError,
  handleError,
  isAppError,
  logError
} from '@/lib/error-handler';

describe('Error classes', () => {
  describe('AppError', () => {
    it('creates error with code and message', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('AppError');
      expect(error.statusCode).toBe(500);
    });

    it('accepts custom status code', () => {
      const error = new AppError('TEST_ERROR', 'Test message', 404);
      expect(error.statusCode).toBe(404);
    });

    it('accepts details', () => {
      const details = { field: 'value' };
      const error = new AppError('TEST_ERROR', 'Test message', 400, details);
      expect(error.details).toEqual(details);
    });

    it('is an instance of Error', () => {
      const error = new AppError('TEST_ERROR', 'Test');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('creates validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('accepts details', () => {
      const details = { field: 'required' };
      const error = new ValidationError('Invalid input', details);
      expect(error.details).toEqual(details);
    });

    it('is instance of AppError', () => {
      const error = new ValidationError('Test');
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('creates not found error with 404 status', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('uses default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
    });

    it('is instance of AppError', () => {
      const error = new NotFoundError();
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('creates network error with 503 status', () => {
      const error = new NetworkError('Connection failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(503);
    });

    it('uses default message', () => {
      const error = new NetworkError();
      expect(error.message).toBe('Network request failed');
    });

    it('is instance of AppError', () => {
      const error = new NetworkError();
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('ServerError', () => {
    it('creates server error with 500 status', () => {
      const error = new ServerError('Server crashed');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('uses default message', () => {
      const error = new ServerError();
      expect(error.message).toBe('Internal server error');
    });

    it('is instance of AppError', () => {
      const error = new ServerError();
      expect(error instanceof AppError).toBe(true);
    });
  });
});

describe('handleError', () => {
  it('returns AppError as-is', () => {
    const error = new AppError('TEST', 'message');
    const result = handleError(error);
    expect(result).toBe(error);
  });

  it('converts standard Error with network message to NetworkError', () => {
    const error = new Error('network connection failed');
    const result = handleError(error);
    expect(result).toBeInstanceOf(NetworkError);
  });

  it('converts standard Error with fetch message to NetworkError', () => {
    const error = new Error('fetch failed');
    const result = handleError(error);
    expect(result).toBeInstanceOf(NetworkError);
  });

  it('converts standard Error with 404 to NotFoundError', () => {
    const error = new Error('not found error 404');
    const result = handleError(error);
    expect(result).toBeInstanceOf(NotFoundError);
  });

  it('converts standard Error with validation message to ValidationError', () => {
    const error = new Error('validation failed');
    const result = handleError(error);
    expect(result).toBeInstanceOf(ValidationError);
  });

  it('converts standard Error with invalid message to ValidationError', () => {
    const error = new Error('invalid input data');
    const result = handleError(error);
    expect(result).toBeInstanceOf(ValidationError);
  });

  it('converts standard Error to ServerError by default', () => {
    const error = new Error('unknown error');
    const result = handleError(error);
    expect(result).toBeInstanceOf(ServerError);
  });

  it('converts non-Error to AppError', () => {
    const result = handleError('string error');
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('converts null to AppError', () => {
    const result = handleError(null);
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('converts undefined to AppError', () => {
    const result = handleError(undefined);
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('converts number to AppError', () => {
    const result = handleError(123);
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('123');
  });

  it('preserves original error message', () => {
    const error = new Error('custom message');
    const result = handleError(error);
    expect(result.message).toBe('custom message');
  });

  it('handles case-insensitive message matching', () => {
    const error = new Error('NETWORK ERROR');
    const result = handleError(error);
    expect(result).toBeInstanceOf(NetworkError);
  });
});

describe('isAppError', () => {
  it('returns true for AppError', () => {
    const error = new AppError('TEST', 'message');
    expect(isAppError(error)).toBe(true);
  });

  it('returns true for ValidationError', () => {
    const error = new ValidationError('test');
    expect(isAppError(error)).toBe(true);
  });

  it('returns true for NotFoundError', () => {
    const error = new NotFoundError();
    expect(isAppError(error)).toBe(true);
  });

  it('returns true for NetworkError', () => {
    const error = new NetworkError();
    expect(isAppError(error)).toBe(true);
  });

  it('returns true for ServerError', () => {
    const error = new ServerError();
    expect(isAppError(error)).toBe(true);
  });

  it('returns false for standard Error', () => {
    const error = new Error('test');
    expect(isAppError(error)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isAppError('error')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAppError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAppError(undefined)).toBe(false);
  });

  it('type narrows correctly', () => {
    const error = new AppError('TEST', 'message');
    if (isAppError(error)) {
      expect(error.code).toBeDefined();
    }
  });
});

describe('logError', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs error with context', () => {
    const error = new AppError('TEST', 'test message', 500, { details: 'value' });
    logError(error, 'context');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[TEST] context: test message',
      { details: 'value' }
    );
  });

  it('logs error without context', () => {
    const error = new AppError('TEST', 'test message');
    logError(error);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[TEST] test message',
      ''
    );
  });

  it('handles standard Error', () => {
    const error = new Error('test');
    logError(error, 'context');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('handles non-Error', () => {
    logError('string error', 'context');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('handles null', () => {
    logError(null, 'context');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('handles undefined', () => {
    logError(undefined, 'context');
    expect(consoleSpy).toHaveBeenCalled();
  });
});
