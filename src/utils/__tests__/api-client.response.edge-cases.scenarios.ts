import { apiClient } from '@/utils/api-client';
import { getMockAxiosInstance } from './api-client-mock-helpers';

export function describeEdgeCases(): void {
  describe('Edge cases', () => {
    it('handles null response data', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: null });
      const result = await apiClient.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it('handles undefined response data', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: undefined });
      const result = await apiClient.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toBe(undefined);
    });

    it('handles empty object response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: {} });
      const result = await apiClient.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('handles large response data', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      const largeData = {
        items: Array.from({ length: 10000 }, (_, i) => ({ id: i })),
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: largeData });
      const result = await apiClient.get('/test');
      expect(result.data).toEqual(largeData);
    });

    it('handles special characters in URL', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: {} });
      await apiClient.get('/test?param=value%20with%20spaces');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/test?param=value%20with%20spaces',
        undefined
      );
    });

    it('handles concurrent requests', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: { id: 1 } });
      const promises = Array.from({ length: 10 }, (_, i) => apiClient.get(`/test/${i}`));
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => expect(result.success).toBe(true));
    });

    it('handles request timeout', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      } as any);
      const result = await apiClient.get('/test');
      expect(result.success).toBe(false);
    });

    it('handles malformed response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: 'invalid json string',
      });
      const result = await apiClient.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toBe('invalid json string');
    });
  });
}

export function describeTypeSafety(): void {
  describe('Type safety', () => {
    it('enforces ApiResponse type', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: { id: 1, name: 'test' },
      });
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
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: 42 });
      const result = await apiClient.get<number>('/test');
      if (result.success) {
        expect(typeof result.data).toBe('number');
      }
    });

    it('allows undefined generic type', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: null });
      const result = await apiClient.get('/test');
      expect(result.success).toBe(true);
    });
  });
}

export function describeSingletonBehavior(): void {
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
}
