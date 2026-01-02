import { apiClient } from '@/utils/api-client';
import { getMockAxiosInstance } from './api-client-mock-helpers';

export function describePatchRequests(): void {
  describe('patch', () => {
    it('makes PATCH request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.patch as jest.Mock).mockResolvedValue({
        data: { result: 'patched' },
      });

      const result = await apiClient.patch('/test', { data: 'value' });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/test',
        { data: 'value' },
        undefined
      );
      expect(result).toEqual({
        success: true,
        data: { result: 'patched' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.patch as jest.Mock).mockResolvedValue({ data: {} });

      await apiClient.patch('/test', {}, { headers: { 'X-Custom': 'value' } });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/test',
        {},
        { headers: { 'X-Custom': 'value' } }
      );
    });

    it('handles error', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.patch as jest.Mock).mockRejectedValue({
        message: 'Error',
      });

      const result = await apiClient.patch('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('patches without data', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.patch as jest.Mock).mockResolvedValue({ data: {} });

      await apiClient.patch('/test');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/test',
        undefined,
        undefined
      );
    });

    it('returns typed response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.patch as jest.Mock).mockResolvedValue({
        data: { id: 1, patched: true },
      });

      const result = await apiClient.patch<{ id: number; patched: boolean }>('/test');

      expect(result.data).toEqual({ id: 1, patched: true });
    });
  });
}
