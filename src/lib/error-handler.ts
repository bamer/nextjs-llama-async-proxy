export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super('NOT_FOUND', message, 404);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super('NETWORK_ERROR', message, 503);
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super('SERVER_ERROR', message, 500);
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return new NetworkError(error.message);
    }

    if (message.includes('not found') || message.includes('404')) {
      return new NotFoundError(error.message);
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return new ValidationError(error.message);
    }

    return new ServerError(error.message);
  }

  return new AppError('UNKNOWN_ERROR', String(error));
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function logError(error: unknown, context?: string): void {
  const appError = handleError(error);
  console.error(`[${appError.code}] ${context ? `${context}: ` : ''}${appError.message}`, appError.details || '');
}
