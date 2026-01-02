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

export const TEST_ERROR_CODE = 'TEST_CODE';
export const TEST_ERROR_MESSAGE = 'Test error message';
export const TEST_ERROR_DETAILS = { field: 'test', value: 123 };

export function createTestAppError(): AppError {
  return new AppError(TEST_ERROR_CODE, TEST_ERROR_MESSAGE);
}

export function createTestAppErrorWithDetails(): AppError {
  return new AppError(TEST_ERROR_CODE, TEST_ERROR_MESSAGE, 400, TEST_ERROR_DETAILS);
}

export function createValidationError(): ValidationError {
  return new ValidationError('Invalid input');
}

export function createNotFoundError(): NotFoundError {
  return new NotFoundError();
}

export function createNetworkError(): NetworkError {
  return new NetworkError();
}

export function createServerError(): ServerError {
  return new ServerError();
}
