import { apiClient } from '@/utils/api-client';
import { getMockAxiosInstance } from './api-client-mock-helpers';

export function describePutRequests(): void {
  describe('put', () => {
    it('makes PUT request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.put as jest.Mock).mockResolvedValue({
        data: { result: 'updated' },
      });

      const result = await apiClient.put('/test', { data: 'value' });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/test',
        { data: 'value' },
        undefined
      );
      expect(result).toEqual({
        success: true,
        data: { result: 'updated' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.put as jest.Mock).mockResolvedValue({ data: {} });

      await apiClient.put('/test', {}, { headers: { 'X-Custom': 'value' } });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/test',
        {},
        { headers: { 'X-Custom': 'value' } }
      );
    });

    it('handles error', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.put as jest.Mock).mockRejectedValue({
        message: 'Error',
      });

      const result = await apiClient.put('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('puts without data', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.put as jest.Mock).mockResolvedValue({ data: {} });

      await apiClient.put('/test');

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/test',
        undefined,
        undefined
      );
    });

    it('returns typed response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.put as jest.Mock).mockResolvedValue({
        data: { id: 1, updated: true },
      });

      const result = await apiClient.put<{ id: number; updated: boolean }>('/test');

      expect(result.data).toEqual({ id: 1, updated: true });
    });
  });
}

export function describeDeleteRequests(): void {
  describe('delete', () => {
    it('makes DELETE request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({
        data: { result: 'deleted' },
      });

      const result = await apiClient.delete('/test');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({
        success: true,
        data: { result: 'deleted' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({ data: {} });

      await apiClient.delete('/test', { headers: { 'X-Custom': 'value' } });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', {
        headers: { 'X-Custom': 'value' },
      });
    });

    it('handles error', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.delete as jest.Mock).mockRejectedValue({
        message: 'Error',
      });

      const result = await apiClient.delete('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns typed response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({
        data: { id: 1, deleted: true },
      });

      const result = await apiClient.delete<{ id: number; deleted: boolean }>('/test');

      expect(result.data).toEqual({ id: 1, deleted: true });
    });
  });
}
