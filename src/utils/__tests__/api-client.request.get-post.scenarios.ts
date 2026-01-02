import { apiClient } from '@/utils/api-client';
import { getMockAxiosInstance } from './api-client-mock-helpers';

export function describeGetRequests(): void {
  describe('get', () => {
    it('makes GET request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: { result: 'success' },
      });

      const result = await apiClient.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({
        success: true,
        data: { result: 'success' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: {} });

      await apiClient.get('/test', { params: { page: 1 } });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {
        params: { page: 1 },
      });
    });

    it('handles error', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue({
        message: 'Error',
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns typed response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: { id: 1, name: 'test' },
      });

      const result = await apiClient.get<{ id: number; name: string }>('/test');

      expect(result.data).toEqual({ id: 1, name: 'test' });
    });
  });
}

export function describePostRequests(): void {
  describe('post', () => {
    it('makes POST request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({
        data: { result: 'created' },
      });

      const result = await apiClient.post('/test', { data: 'value' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test',
        { data: 'value' },
        undefined
      );
      expect(result).toEqual({
        success: true,
        data: { result: 'created' },
        timestamp: expect.any(String),
      });
    });

    it('passes config to request', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ data: {} });

      await apiClient.post('/test', {}, { headers: { 'X-Custom': 'value' } });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test',
        {},
        { headers: { 'X-Custom': 'value' } }
      );
    });

    it('handles error', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue({
        message: 'Error',
      });

      const result = await apiClient.post('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('posts without data', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ data: {} });

      await apiClient.post('/test');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/test',
        undefined,
        undefined
      );
    });

    it('returns typed response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({
        data: { id: 1, created: true },
      });

      const result = await apiClient.post<{ id: number; created: boolean }>('/test');

      expect(result.data).toEqual({ id: 1, created: true });
    });
  });
}
