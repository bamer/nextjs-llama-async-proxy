import { ApiClient } from '@/utils/api-client';
import axios from 'axios';

jest.mock('axios');

describe('ApiClient Configuration', () => {
  let apiClient: ApiClient;
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockedAxios = axios as jest.Mocked<typeof axios>;
    apiClient = new ApiClient();
  });

  it('initializes request interceptor on first request', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
    mockedAxios.create.mockReturnValue({
      get: mockGet,
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    } as any);

    await apiClient.get('/test');

    const mockInstance = mockedAxios.create.mock.results[0].value as any;
    expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
  });

  it('includes Content-Type and Accept headers', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
    mockedAxios.create.mockReturnValue({ get: mockGet } as any);

    await apiClient.get('/test');

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
    );
  });
});
