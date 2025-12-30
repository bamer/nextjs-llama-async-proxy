import { ApiClient, apiClient } from '@/utils/api-client';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

jest.mock('axios');

describe('ApiClient - Additional Edge Cases', () => {
  let client: ApiClient;
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockedAxios = axios as jest.Mocked<typeof axios>;
    client = new ApiClient();
  });

  describe('resetInstance', () => {
    it('should reset the internal axios instance', async () => {
      const mockGet1 = jest.fn().mockResolvedValue({ data: { test: 1 } });
      mockedAxios.create.mockReturnValue({
        get: mockGet1,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await client.get('/test');
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);

      client.resetInstance();
      const mockGet2 = jest.fn().mockResolvedValue({ data: { test: 2 } });
      mockedAxios.create.mockReturnValue({
        get: mockGet2,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await client.get('/test');
      expect(mockedAxios.create).toHaveBeenCalledTimes(2);
    });

    it('should allow re-initialization after reset', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      client.resetInstance();
      await client.get('/test');

      const mockInstance = mockedAxios.create.mock.results[0].value as any;
      expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Request interceptor behavior', () => {
    it('passes through request config unchanged', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await client.get('/test', { params: { id: 123 } });

      expect(mockGet).toHaveBeenCalledWith('/test', { params: { id: 123 } });
    });
  });

  describe('Response interceptor behavior', () => {
    it('extracts data from axios response', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { result: 'success' } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: any) => {
              return response.data;
            }),
          },
        },
      } as any);

      await client.get('/test');
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('Error formatting edge cases', () => {
    it('handles error with undefined response and request', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Generic error'));
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.details).toBeDefined();
    });

    it('handles error with empty error message', async () => {
      const error = new Error('');
      const mockGet = jest.fn().mockRejectedValue(error);
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('');
    });

    it('handles error with null stack', async () => {
      const error = new Error('Error without stack');
      error.stack = null as any;
      const mockGet = jest.fn().mockRejectedValue(error);
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('handles error with circular reference in response data', async () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;
      const mockGet = jest.fn().mockRejectedValue({
        message: 'Error',
        response: {
          status: 500,
          statusText: 'Server Error',
          data: circularData,
        },
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('500');
    });
  });

  describe('Network error edge cases', () => {
    it('handles request without request object', async () => {
      const error = { message: 'Request failed' };
      const mockGet = jest.fn().mockRejectedValue(error);
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('handles error with empty request object', async () => {
      const error = { message: 'Request failed', request: {} };
      const mockGet = jest.fn().mockRejectedValue(error);
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('HTTP status edge cases', () => {
    it('handles 201 Created', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: { id: 1 },
        status: 201,
        statusText: 'Created',
      });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.post('/test', { name: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1 });
    });

    it('handles 204 No Content', async () => {
      const mockDelete = jest.fn().mockResolvedValue({
        data: null,
        status: 204,
        statusText: 'No Content',
      });
      mockedAxios.create.mockReturnValue({
        delete: mockDelete,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.delete('/test/1');
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('handles 429 Too Many Requests', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        message: 'Too Many Requests',
        response: {
          status: 429,
          statusText: 'Too Many Requests',
          data: { error: 'Rate limit exceeded' },
        },
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('429');
    });
  });

  describe('Multiple consecutive requests', () => {
    it('handles multiple requests efficiently', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const promises = [
        client.get('/test1'),
        client.get('/test2'),
        client.get('/test3'),
      ];

      await Promise.all(promises);

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
    });

    it('shares interceptors across multiple requests', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await client.get('/test');
      await client.post('/test', {});

      const mockInstance = mockedAxios.create.mock.results[0].value as any;
      expect(mockInstance.interceptors.request.use).toHaveBeenCalledTimes(1);
      expect(mockInstance.interceptors.response.use).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timestamp precision', () => {
    it('generates timestamps with millisecond precision', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { test: 1 } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await client.get('/test');

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Singleton behavior', () => {
    it('exported apiClient instance is shared', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { test: 1 } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await apiClient.get('/test1');
      await apiClient.get('/test2');

      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });
});
