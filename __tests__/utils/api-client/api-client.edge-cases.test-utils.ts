import { ApiClient } from '@/utils/api-client';
import axios, { AxiosRequestConfig } from 'axios';

jest.mock('axios');

// Export mockedAxios for tests that need it
export const mockedAxios = jest.mocked(axios);

export const createApiClient = () => new ApiClient();

export const createMockedAxios = () => {
  const mocked = axios as jest.Mocked<typeof axios>;
  jest.clearAllMocks();
  jest.resetModules();
  return mocked;
};

export const mockGetSuccess = (data: unknown) => {
  const mockGet = jest.fn().mockResolvedValue({ data });
  return { mockGet, mockedAxios: createMockedAxios() };
};

export const mockGetError = (status: number, message: string) => {
  const mockGet = jest.fn().mockRejectedValue({
    message,
    response: { status, statusText: message, data: { error: message } },
  });
  return { mockGet, mockedAxios: createMockedAxios() };
};
