import { apiClient } from '@/utils/api-client';
import { AxiosError } from 'axios';
import { getMockAxiosInstance } from './api-client-mock-helpers';

export function describeResponseInterceptor(): void {
  describe('response interceptor', () => {
    it('returns response data on success', () => {
      const mockAxiosInstance = getMockAxiosInstance();
      const responseInterceptorSuccess = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][0];
      const response = { data: { test: 'data' } };

      const result = responseInterceptorSuccess(response);

      expect(result).toBe(response.data);
    });

    it('handles 401 errors', () => {
      const mockAxiosInstance = getMockAxiosInstance();
      const error = {
        response: { status: 401, statusText: 'Unauthorized', data: {} },
      } as AxiosError;

      const responseInterceptorError = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];
      const result = responseInterceptorError(error);

      expect(result).rejects.toHaveProperty('code', '401');
    });

    it('handles 403 errors', () => {
      const mockAxiosInstance = getMockAxiosInstance();
      const error = {
        response: { status: 403, statusText: 'Forbidden', data: {} },
      } as AxiosError;

      const responseInterceptorError = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];
      const result = responseInterceptorError(error);

      expect(result).rejects.toHaveProperty('code', '403');
    });

    it('handles 404 errors', () => {
      const mockAxiosInstance = getMockAxiosInstance();
      const error = {
        response: { status: 404, statusText: 'Not Found', data: {} },
      } as AxiosError;

      const responseInterceptorError = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];
      const result = responseInterceptorError(error);

      expect(result).rejects.toHaveProperty('code', '404');
    });

    it('handles 500 errors', () => {
      const mockAxiosInstance = getMockAxiosInstance();
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: {},
        },
      } as AxiosError;

      const responseInterceptorError = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];
      const result = responseInterceptorError(error);

      expect(result).rejects.toHaveProperty('code', '500');
    });
  });
}

export function describeFormatError(): void {
  describe('formatError', () => {
    it('formats error with response', () => {
      const mockAxiosInstance = getMockAxiosInstance();
      const responseInterceptorError = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];
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
      const mockAxiosInstance = getMockAxiosInstance();
      const responseInterceptorError = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];
      const error = { request: {}, message: 'Network Error' } as AxiosError;

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
      const mockAxiosInstance = getMockAxiosInstance();
      const responseInterceptorError = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];
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
      const mockAxiosInstance = getMockAxiosInstance();
      const responseInterceptorError = (
        mockAxiosInstance.interceptors.response.use as jest.Mock
      ).mock.calls[0][1];
      const error = { message: 'Test error' } as AxiosError;

      const result = responseInterceptorError(error);

      result.catch((formattedError: any) => {
        expect(() => new Date(formattedError.timestamp)).not.toThrow();
      });
    });
  });
}
