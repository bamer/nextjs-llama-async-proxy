import axios, { AxiosError } from 'axios';
import { ApiClient, apiClient } from '@/utils/api-client';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;
const mockCreate = mockAxios.create as jest.Mock;

describe('api-client', () => {
  let clientInstance: any;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };

    mockCreate.mockReturnValue(mockAxiosInstance);
    clientInstance = new ApiClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: expect.any(Number),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    });

    it('should initialize request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledTimes(1);
    });
  });

  describe('get method', () => {
    it('should make successful GET request', async () => {
      const mockData = { message: 'success' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await clientInstance.get('/test');

      expect(result).toEqual({
        success: true,
        data: mockData,
        timestamp: expect.any(String),
      });
    });

    it('should pass config to axios.get', async () => {
      const config = { headers: { 'X-Custom': 'value' } };
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      await clientInstance.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
    });

    it('should handle axios error on GET', async () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { error: 'Resource not found' },
        },
      } as AxiosError;
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await clientInstance.get('/test');

      expect(result).toEqual({
        success: false,
        error: {
          code: '404',
          message: 'Not Found',
          details: { error: 'Resource not found' },
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle network error on GET', async () => {
      const error = {
        request: {},
        message: 'Network Error',
      } as AxiosError;
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await clientInstance.get('/test');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error',
          details: 'Network Error',
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle unknown error on GET', async () => {
      const error = {
        message: 'Unknown error',
        stack: 'stack trace',
      } as AxiosError;
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await clientInstance.get('/test');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error',
          details: 'stack trace',
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('post method', () => {
    it('should make successful POST request', async () => {
      const mockData = { id: 1 };
      const payload = { name: 'test' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockData });

      const result = await clientInstance.post('/test', payload);

      expect(result).toEqual({
        success: true,
        data: mockData,
        timestamp: expect.any(String),
      });
    });

    it('should pass data and config to axios.post', async () => {
      const data = { value: 42 };
      const config = { timeout: 5000 };
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await clientInstance.post('/test', data, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data, config);
    });

    it('should handle error on POST', async () => {
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: {},
        },
      } as AxiosError;
      mockAxiosInstance.post.mockRejectedValue(error);

      const result = await clientInstance.post('/test', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('500');
    });
  });

  describe('put method', () => {
    it('should make successful PUT request', async () => {
      const mockData = { updated: true };
      const payload = { name: 'updated' };
      mockAxiosInstance.put.mockResolvedValue({ data: mockData });

      const result = await clientInstance.put('/test/1', payload);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('should handle error on PUT', async () => {
      const error = {
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: {},
        },
      } as AxiosError;
      mockAxiosInstance.put.mockRejectedValue(error);

      const result = await clientInstance.put('/test/1', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('403');
    });
  });

  describe('delete method', () => {
    it('should make successful DELETE request', async () => {
      const mockData = { deleted: true };
      mockAxiosInstance.delete.mockResolvedValue({ data: mockData });

      const result = await clientInstance.delete('/test/1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('should handle error on DELETE', async () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: {},
        },
      } as AxiosError;
      mockAxiosInstance.delete.mockRejectedValue(error);

      const result = await clientInstance.delete('/test/1');

      expect(result.success).toBe(false);
    });
  });

  describe('patch method', () => {
    it('should make successful PATCH request', async () => {
      const mockData = { patched: true };
      const payload = { name: 'patched' };
      mockAxiosInstance.patch.mockResolvedValue({ data: mockData });

      const result = await clientInstance.patch('/test/1', payload);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('should handle error on PATCH', async () => {
      const error = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: {},
        },
      } as AxiosError;
      mockAxiosInstance.patch.mockRejectedValue(error);

      const result = await clientInstance.patch('/test/1', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('400');
    });
  });

  describe('formatError private method', () => {
    it('should format axios error with response', async () => {
      const error = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Invalid token' },
        },
      } as AxiosError;
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await clientInstance.get('/test');

      expect(result.error).toEqual({
        code: '401',
        message: 'Unauthorized',
        details: { message: 'Invalid token' },
      });
    });

    it('should format axios error with network request', async () => {
      const error = {
        request: {},
        message: 'Connection timeout',
      } as AxiosError;
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await clientInstance.get('/test');

      expect(result.error).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Network error',
        details: 'Connection timeout',
      });
    });

    it('should format axios error without request or response', async () => {
      const error = {
        message: 'Configuration error',
        stack: 'error stack',
      } as AxiosError;
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await clientInstance.get('/test');

      expect(result.error).toEqual({
        code: 'UNKNOWN_ERROR',
        message: 'Configuration error',
        details: 'error stack',
      });
    });
  });

  describe('timestamp formatting', () => {
    it('should include ISO timestamp in successful response', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const result = await clientInstance.get('/test');

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include ISO timestamp in error response', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 500, statusText: 'Error', data: {} },
      } as AxiosError);

      const result = await clientInstance.get('/test');

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('apiClient singleton', () => {
    it('should export singleton instance', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });

    it('should reuse same instance across imports', () => {
      const { apiClient: apiClient1 } = require('@/utils/api-client');
      const { apiClient: apiClient2 } = require('@/utils/api-client');

      expect(apiClient1).toBe(apiClient2);
    });
  });

  describe('TypeScript generics', () => {
    it('should support generic type parameter for GET', async () => {
      type TestType = { id: number; name: string };
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1, name: 'test' } });

      const result = await clientInstance.get<TestType>('/test');

      expect(result.data).toEqual({ id: 1, name: 'test' });
    });

    it('should support generic type parameter for POST', async () => {
      type TestType = { id: number; created: boolean };
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1, created: true } });

      const result = await clientInstance.post<TestType>('/test', {});

      expect(result.data).toEqual({ id: 1, created: true });
    });
  });
});
