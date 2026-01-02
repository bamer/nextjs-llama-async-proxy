// Set up console spy before importing error-handler
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock the logger module to use the spy
jest.mock('@/lib/logger', () => ({
  getLogger: () => ({
    error: consoleErrorSpy,
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }),
}));

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
import {
  TEST_ERROR_CODE,
  TEST_ERROR_MESSAGE,
  TEST_ERROR_DETAILS,
  createTestAppError,
  createTestAppErrorWithDetails,
  createValidationError,
  createNotFoundError,
  createNetworkError,
  createServerError,
} from './error-handler.utils';

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

export function describeAppErrorScenarios(): void {
  it('should create an error with code and message', () => {
    const error = createTestAppError();
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(TEST_ERROR_CODE);
    expect(error.message).toBe(TEST_ERROR_MESSAGE);
    expect(error.name).toBe('AppError');
  });

  it('should create an error with default status code 500', () => {
    const error = createTestAppError();
    expect(error.statusCode).toBe(500);
  });

  it('should allow custom status code', () => {
    const error = new AppError(TEST_ERROR_CODE, TEST_ERROR_MESSAGE, 400);
    expect(error.statusCode).toBe(400);
  });

  it('should accept details parameter', () => {
    const error = createTestAppErrorWithDetails();
    expect(error.details).toEqual(TEST_ERROR_DETAILS);
  });

  it('should work without details parameter', () => {
    const error = createTestAppError();
    expect(error.details).toBeUndefined();
  });
}

export function describeValidationErrorScenarios(): void {
  it('should inherit from AppError', () => {
    const error = createValidationError();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have code VALIDATION_ERROR', () => {
    const error = createValidationError();
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should have status code 400', () => {
    const error = createValidationError();
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
}

export function describeNotFoundErrorScenarios(): void {
  it('should inherit from AppError', () => {
    const error = createNotFoundError();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have code NOT_FOUND', () => {
    const error = createNotFoundError();
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should have status code 404', () => {
    const error = createNotFoundError();
    expect(error.statusCode).toBe(404);
  });

  it('should use default message if not provided', () => {
    const error = createNotFoundError();
    expect(error.message).toBe('Resource not found');
  });

  it('should accept custom message', () => {
    const error = new NotFoundError('Model not found');
    expect(error.message).toBe('Model not found');
  });
}

export function describeNetworkErrorScenarios(): void {
  it('should inherit from AppError', () => {
    const error = createNetworkError();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have code NETWORK_ERROR', () => {
    const error = createNetworkError();
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('should have status code 503', () => {
    const error = createNetworkError();
    expect(error.statusCode).toBe(503);
  });

  it('should use default message if not provided', () => {
    const error = createNetworkError();
    expect(error.message).toBe('Network request failed');
  });

  it('should accept custom message', () => {
    const error = new NetworkError('Connection timeout');
    expect(error.message).toBe('Connection timeout');
  });
}

export function describeServerErrorScenarios(): void {
  it('should inherit from AppError', () => {
    const error = createServerError();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have code SERVER_ERROR', () => {
    const error = createServerError();
    expect(error.code).toBe('SERVER_ERROR');
  });

  it('should have status code 500', () => {
    const error = createServerError();
    expect(error.statusCode).toBe(500);
  });

  it('should use default message if not provided', () => {
    const error = createServerError();
    expect(error.message).toBe('Internal server error');
  });

  it('should accept custom message', () => {
    const error = new ServerError('Database connection failed');
    expect(error.message).toBe('Database connection failed');
  });
}

export function describeHandleErrorScenarios(): void {
  it('should return AppError unchanged', () => {
    const originalError = createValidationError();
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
}

export function describeIsAppErrorScenarios(): void {
  it('should return true for AppError', () => {
    const error = createTestAppError();
    expect(isAppError(error)).toBe(true);
  });

  it('should return true for ValidationError', () => {
    const error = createValidationError();
    expect(isAppError(error)).toBe(true);
  });

  it('should return true for NotFoundError', () => {
    const error = createNotFoundError();
    expect(isAppError(error)).toBe(true);
  });

  it('should return true for NetworkError', () => {
    const error = createNetworkError();
    expect(isAppError(error)).toBe(true);
  });

  it('should return true for ServerError', () => {
    const error = createServerError();
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
}

export function describeLogErrorScenarios(): void {
  it('should log AppError with code and message', () => {
    const error = createTestAppError();
    logError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(`[${TEST_ERROR_CODE}] ${TEST_ERROR_MESSAGE}`, '');
  });

  it('should log AppError with details', () => {
    const error = createTestAppErrorWithDetails();
    logError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(`[${TEST_ERROR_CODE}] ${TEST_ERROR_MESSAGE}`, TEST_ERROR_DETAILS);
  });

  it('should log Error converted to AppError', () => {
    const error = new Error('Test error');
    logError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[SERVER_ERROR] Test error', '');
  });

  it('should log with context prefix', () => {
    const error = createTestAppError();
    logError(error, 'MyContext');

    expect(consoleErrorSpy).toHaveBeenCalledWith(`[${TEST_ERROR_CODE}] MyContext: ${TEST_ERROR_MESSAGE}`, '');
  });

  it('should log with context and details', () => {
    const details = { field: 'test' };
    const error = new AppError(TEST_ERROR_CODE, TEST_ERROR_MESSAGE, 400, details);
    logError(error, 'MyContext');

    expect(consoleErrorSpy).toHaveBeenCalledWith(`[${TEST_ERROR_CODE}] MyContext: ${TEST_ERROR_MESSAGE}`, details);
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
}
