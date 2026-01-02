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

describe('ApiClient HTTP Methods - PUT, DELETE, PATCH', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAPP_CONFIG.api = {
      baseUrl: 'http://localhost:3000',
      websocketUrl: 'ws://localhost:3000',
      timeout: 30000,
    };
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
});
