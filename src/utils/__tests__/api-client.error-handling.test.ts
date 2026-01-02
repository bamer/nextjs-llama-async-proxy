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
import { AxiosError } from 'axios';
const mockAxiosInstance = axios as any;
const mockedAPP_CONFIG = APP_CONFIG as any;

import { apiClient } from '@/utils/api-client';

describe('ApiClient Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAPP_CONFIG.api = {
      baseUrl: 'http://localhost:3000',
      websocketUrl: 'ws://localhost:3000',
      timeout: 30000,
    };
  });

  describe('formatError', () => {
    it('formats error with response', () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Resource not found' },
        },
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(error);

      return apiClient.get('/test').catch((result) => {
        expect(result).toEqual({
          success: false,
          error: {
            code: '404',
            message: 'Not Found',
            details: { detail: 'Resource not found' },
          },
          timestamp: expect.any(String),
        });
      });
    });

    it('formats network error', () => {
      const error = {
        request: {},
        message: 'Network Error',
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(error);

      return apiClient.get('/test').catch((result) => {
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
    });

    it('formats unknown error', () => {
      const error = {
        message: 'Unknown error',
        stack: 'Error stack trace',
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(error);

      return apiClient.get('/test').catch((result) => {
        expect(result).toEqual({
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'Unknown error',
            details: 'Error stack trace',
          },
          timestamp: expect.any(String),
        });
      });
    });

    it('includes ISO timestamp', () => {
      const error = {
        message: 'Test error',
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(error);

      return apiClient.get('/test').catch((result) => {
        expect(() => new Date(result.timestamp)).not.toThrow();
      });
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
});
