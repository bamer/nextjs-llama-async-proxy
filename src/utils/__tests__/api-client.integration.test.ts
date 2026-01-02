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

describe('ApiClient Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAPP_CONFIG.api = {
      baseUrl: 'http://localhost:3000',
      websocketUrl: 'ws://localhost:3000',
      timeout: 30000,
    };
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
