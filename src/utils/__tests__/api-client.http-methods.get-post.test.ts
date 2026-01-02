import { APP_CONFIG } from '@/config/app.config';

jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    create: jest.fn(() => mockAxiosInstance),
    mockAxiosInstance,
  };
});

jest.mock('@/config/app.config');

import axios from "axios";
const mockAxiosInstance = axios as any;
const mockedAPP_CONFIG = APP_CONFIG as any;

import { apiClient } from '@/utils/api-client';

describe('ApiClient HTTP Methods - GET and POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAPP_CONFIG.api = {
      baseUrl: 'http://localhost:3000',
      websocketUrl: 'ws://localhost:3000',
      timeout: 30000,
    };
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
});
