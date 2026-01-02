import { APP_CONFIG } from '@/config/app.config';

jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
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

describe('ApiClient Edge Cases and Type Safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAPP_CONFIG.api = {
      baseUrl: 'http://localhost:3000',
      websocketUrl: 'ws://localhost:3000',
      timeout: 30000,
    };
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
});
