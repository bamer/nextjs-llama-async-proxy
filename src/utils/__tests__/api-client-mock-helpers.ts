import { APP_CONFIG } from '@/config/app.config';
import axios from 'axios';
import { AxiosError } from 'axios';

// Get mock axios instance - this IS the mocked axios
export function getMockAxiosInstance(): any {
  return axios as any;
}

// Setup function for test configuration
export function setupMockConfig(): void {
  const mockedAPP_CONFIG = APP_CONFIG as any;
  mockedAPP_CONFIG.api = {
    baseUrl: 'http://localhost:3000',
    websocketUrl: 'ws://localhost:3000',
    timeout: 30000,
  };
}

// Cleanup function for mocks - simplified to avoid breaking mock structure
export function clearMocks(): void {
  jest.clearAllMocks();
}

// Create test error helpers
export function createAxiosError(
  status: number,
  statusText: string,
  data: unknown = {}
): AxiosError {
  return {
    response: {
      status,
      statusText,
      data,
    },
  } as AxiosError;
}

export function createNetworkError(message: string): AxiosError {
  return {
    request: {},
    message,
  } as AxiosError;
}

export function createUnknownError(
  message: string,
  stack?: string
): AxiosError {
  return {
    message,
    stack,
  } as AxiosError;
}

// Get typed mocks
export function getTypedMocks() {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedAPP_CONFIG = APP_CONFIG as any;
  return { mockedAxios, mockedAPP_CONFIG };
}
