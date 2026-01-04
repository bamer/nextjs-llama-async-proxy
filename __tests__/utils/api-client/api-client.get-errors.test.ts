import { ApiClient } from '@/utils/api-client';
import axios from 'axios';

jest.mock('axios');

describe('ApiClient GET Errors', () => {
  let apiClient: ApiClient;
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockedAxios = axios as jest.Mocked<typeof axios>;
    apiClient = new ApiClient();
  });

  it('handles 400 Bad Request', async () => {
    const mockGet = jest.fn().mockRejectedValue({
      message: 'Bad Request',
      response: { status: 400, statusText: 'Bad Request', data: { error: 'Invalid input' } },
    });
    mockedAxios.create.mockReturnValue({ get: mockGet } as any);

    const result = await apiClient.get('/test');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('400');
  });

  it('handles 401 Unauthorized', async () => {
    const mockGet = jest.fn().mockRejectedValue({
      message: 'Unauthorized',
      response: { status: 401, statusText: 'Unauthorized', data: { error: 'Invalid token' } },
    });
    mockedAxios.create.mockReturnValue({ get: mockGet } as any);

    const result = await apiClient.get('/protected');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('401');
  });

  it('handles 404 Not Found', async () => {
    const mockGet = jest.fn().mockRejectedValue({
      message: 'Not Found',
      response: { status: 404, statusText: 'Not Found', data: {} },
    });
    mockedAxios.create.mockReturnValue({ get: mockGet } as any);

    const result = await apiClient.get('/nonexistent');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('404');
  });

  it('handles 500 Internal Server Error', async () => {
    const mockGet = jest.fn().mockRejectedValue({
      message: 'Internal Server Error',
      response: { status: 500, statusText: 'Internal Server Error', data: { error: 'Server crash' } },
    });
    mockedAxios.create.mockReturnValue({ get: mockGet } as any);

    const result = await apiClient.get('/test');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('500');
  });

  it('handles timeout errors', async () => {
    const mockGet = jest.fn().mockRejectedValue({
      message: 'timeout of 5000ms exceeded',
      code: 'ECONNABORTED',
    });
    mockedAxios.create.mockReturnValue({ get: mockGet } as any);

    const result = await apiClient.get('/slow');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });
});
