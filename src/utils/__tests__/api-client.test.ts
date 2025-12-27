import { APP_CONFIG } from '@/config/app.config';

jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn((onFulfilled: any, onRejected: any) => {
          return onFulfilled;
        }),
      },
      response: {
        use: jest.fn((onFulfilled: any, onRejected: any) => {
          return onFulfilled;
        }),
      },
    },
  };

  return {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    mockAxiosInstance,
  };
});

jest.mock('@/config/app.config');

const axios = require('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAPP_CONFIG = APP_CONFIG as any;
const mockAxiosInstance = axios.mockAxiosInstance as any;

import { apiClient } from '@/utils/api-client';
import axiosModule, { AxiosError } from 'axios';

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockAxiosInstance.interceptors.request.use.mockClear();
    mockAxiosInstance.interceptors.response.use.mockClear();

    mockedAPP_CONFIG.api = {
      baseUrl: 'http://localhost:3000',
      websocketUrl: 'ws://localhost:3000',
      timeout: 30000,
    };
  });

  describe('constructor', () => {
    it('creates axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('initializes request interceptor', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('initializes response interceptor', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('request interceptor', () => {
    it('passes through request config', () => {
      const requestInterceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };

      const result = requestInterceptorCall(config);

      expect(result).toBe(config);
    });
  });

  describe('response interceptor', () => {
    it('returns response data on success', () => {
      const responseInterceptorSuccess = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
      const response = { data: { test: 'data' } };

      const result = responseInterceptorSuccess(response);

      expect(result).toBe(response.data);
    });

    it('handles 401 errors', () => {
      const error = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
        },
      } as AxiosError;

      const responseInterceptorError = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const result = responseInterceptorError(error);

      expect(result).rejects.toHaveProperty('code', '401');
    });

    it('handles 403 errors', () => {
      const error = {
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: {},
        },
      } as AxiosError;

      const responseInterceptorError = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const result = responseInterceptorError(error);

      expect(result).rejects.toHaveProperty('code', '403');
    });

    it('handles 404 errors', () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: {},
        },
      } as AxiosError;

      const responseInterceptorError = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const result = responseInterceptorError(error);

      expect(result).rejects.toHaveProperty('code', '404');
    });

    it('handles 500 errors', () => {
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: {},
        },
      } as AxiosError;

      const responseInterceptorError = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const result = responseInterceptorError(error);

      expect(result).rejects.toHaveProperty('code', '500');
    });
  });

  describe('formatError', () => {
    it('formats error with response', () => {
      const responseInterceptorError = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Resource not found' },
        },
      } as AxiosError;

      const result = responseInterceptorError(error);

      expect(result).rejects.toEqual({
        success: false,
        error: {
          code: '404',
          message: 'Not Found',
          details: { detail: 'Resource not found' },
        },
        timestamp: expect.any(String),
      });
    });

    it('formats network error', () => {
      const responseInterceptorError = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const error = {
        request: {},
        message: 'Network Error',
      } as AxiosError;

      const result = responseInterceptorError(error);

      expect(result).rejects.toEqual({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error',
          details: 'Network Error',
        },
        timestamp: expect.any(String),
      });
    });

    it('formats unknown error', () => {
      const responseInterceptorError = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const error = {
        message: 'Unknown error',
        stack: 'Error stack trace',
      } as AxiosError;

      const result = responseInterceptorError(error);

      expect(result).rejects.toEqual({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error',
          details: 'Error stack trace',
        },
        timestamp: expect.any(String),
      });
    });

    it('includes ISO timestamp', () => {
      const responseInterceptorError = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const error = {
        message: 'Test error',
      } as AxiosError;

      const result = responseInterceptorError(error);

      result.catch((formattedError: any) => {
        expect(() => new Date(formattedError.timestamp)).not.toThrow();
      });
    });
  });

  describe('get', () => {
    it('makes GET request', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { result: 'success' } });

      const result = await apiClient.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({
        success: true,
        data: { result: 'success' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });
      const config = { params: { page: 1 } };

      await apiClient.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
    });

    it('handles error', async () => {
      mockAxiosInstance.get.mockRejectedValue({ message: 'Error' });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns typed response', async () => {
      interface TestResponse {
        id: number;
        name: string;
      }

      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1, name: 'test' } });

      const result = await apiClient.get<TestResponse>('/test');

      expect(result.data).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('post', () => {
    it('makes POST request', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { result: 'created' } });

      const result = await apiClient.post('/test', { data: 'value' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', { data: 'value' }, undefined);
      expect(result).toEqual({
        success: true,
        data: { result: 'created' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });
      const config = { headers: { 'X-Custom': 'value' } };

      await apiClient.post('/test', {}, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', {}, config);
    });

    it('handles error', async () => {
      mockAxiosInstance.post.mockRejectedValue({ message: 'Error' });

      const result = await apiClient.post('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('posts without data', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await apiClient.post('/test');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', undefined, undefined);
    });

    it('returns typed response', async () => {
      interface TestResponse {
        id: number;
        created: boolean;
      }

      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1, created: true } });

      const result = await apiClient.post<TestResponse>('/test');

      expect(result.data).toEqual({ id: 1, created: true });
    });
  });

  describe('put', () => {
    it('makes PUT request', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: { result: 'updated' } });

      const result = await apiClient.put('/test', { data: 'value' });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', { data: 'value' }, undefined);
      expect(result).toEqual({
        success: true,
        data: { result: 'updated' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} });
      const config = { headers: { 'X-Custom': 'value' } };

      await apiClient.put('/test', {}, config);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', {}, config);
    });

    it('handles error', async () => {
      mockAxiosInstance.put.mockRejectedValue({ message: 'Error' });

      const result = await apiClient.put('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('puts without data', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} });

      await apiClient.put('/test');

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', undefined, undefined);
    });

    it('returns typed response', async () => {
      interface TestResponse {
        id: number;
        updated: boolean;
      }

      mockAxiosInstance.put.mockResolvedValue({ data: { id: 1, updated: true } });

      const result = await apiClient.put<TestResponse>('/test');

      expect(result.data).toEqual({ id: 1, updated: true });
    });
  });

  describe('delete', () => {
    it('makes DELETE request', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { result: 'deleted' } });

      const result = await apiClient.delete('/test');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({
        success: true,
        data: { result: 'deleted' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });
      const config = { headers: { 'X-Custom': 'value' } };

      await apiClient.delete('/test', config);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', config);
    });

    it('handles error', async () => {
      mockAxiosInstance.delete.mockRejectedValue({ message: 'Error' });

      const result = await apiClient.delete('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns typed response', async () => {
      interface TestResponse {
        id: number;
        deleted: boolean;
      }

      mockAxiosInstance.delete.mockResolvedValue({ data: { id: 1, deleted: true } });

      const result = await apiClient.delete<TestResponse>('/test');

      expect(result.data).toEqual({ id: 1, deleted: true });
    });
  });

  describe('patch', () => {
    it('makes PATCH request', async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: { result: 'patched' } });

      const result = await apiClient.patch('/test', { data: 'value' });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test', { data: 'value' }, undefined);
      expect(result).toEqual({
        success: true,
        data: { result: 'patched' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: {} });
      const config = { headers: { 'X-Custom': 'value' } };

      await apiClient.patch('/test', {}, config);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test', {}, config);
    });

    it('handles error', async () => {
      mockAxiosInstance.patch.mockRejectedValue({ message: 'Error' });

      const result = await apiClient.patch('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('patches without data', async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: {} });

      await apiClient.patch('/test');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test', undefined, undefined);
    });

    it('returns typed response', async () => {
      interface TestResponse {
        id: number;
        patched: boolean;
      }

      mockAxiosInstance.patch.mockResolvedValue({ data: { id: 1, patched: true } });

      const result = await apiClient.patch<TestResponse>('/test');

      expect(result.data).toEqual({ id: 1, patched: true });
    });
  });

  describe('ApiResponse structure', () => {
    it('returns success response', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { test: 'data' } });

      const result = await apiClient.get('/test');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result).not.toHaveProperty('error');
    });

    it('returns error response', async () => {
      mockAxiosInstance.get.mockRejectedValue({ message: 'Error' });

      const result = await apiClient.get('/test');

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('timestamp');
      expect(result).not.toHaveProperty('data');
    });

    it('includes timestamp in ISO format', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const result = await apiClient.get('/test');

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('error response includes code, message, details', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        message: 'Test error',
        stack: 'Error stack',
      });

      const result = await apiClient.get('/test');

      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('details');
    });
  });

  describe('Edge cases', () => {
    it('handles null response data', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: null });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it('handles undefined response data', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: undefined });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toBe(undefined);
    });

    it('handles empty object response', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('handles large response data', async () => {
      const largeData = { items: Array.from({ length: 10000 }, (_, i) => ({ id: i })) };
      mockAxiosInstance.get.mockResolvedValue({ data: largeData });

      const result = await apiClient.get('/test');

      expect(result.data).toEqual(largeData);
    });

    it('handles special characters in URL', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      await apiClient.get('/test?param=value%20with%20spaces');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test?param=value%20with%20spaces', undefined);
    });

    it('handles concurrent requests', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1 } });

      const promises = Array.from({ length: 10 }, (_, i) => apiClient.get(`/test/${i}`));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('handles request timeout', async () => {
      const error = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      } as any;
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
    });

    it('handles malformed response', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: 'invalid json string' });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toBe('invalid json string');
    });
  });

  describe('Type safety', () => {
    it('enforces ApiResponse type', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1, name: 'test' } });

      interface TestData {
        id: number;
        name: string;
      }

      const result = await apiClient.get<TestData>('/test');

      if (result.success && result.data) {
        expect(result.data.id).toBe(1);
        expect(result.data.name).toBe('test');
      }
    });

    it('allows generic type parameter', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: 42 });

      const result = await apiClient.get<number>('/test');

      if (result.success) {
        expect(typeof result.data).toBe('number');
      }
    });

    it('allows undefined generic type', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: null });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('handles full request lifecycle', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true, id: 1 } });

      const result = await apiClient.get<{ success: boolean; id: number }>('/api/users/1');

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.id).toBe(1);
      expect(result.timestamp).toBeDefined();
    });

    it('handles error response with details', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: {
            errors: ['Field is required'],
          },
        },
      });

      const result = await apiClient.post('/api/users', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('400');
      expect(result.error?.message).toBe('Bad Request');
      expect(result.error?.details).toEqual({
        errors: ['Field is required'],
      });
    });

    it('handles network error without response', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        request: {},
        message: 'Network Error',
      });

      const result = await apiClient.get('/api/users');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network error');
    });

    it('handles unknown error', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        message: 'Unexpected error',
        stack: 'at Error (native)',
      });

      const result = await apiClient.get('/api/users');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toBe('Unexpected error');
    });
  });

  describe('Singleton behavior', () => {
    it('exports single instance', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
    });
  });
});
