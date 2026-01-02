import { apiClient } from '@/utils/api-client';
import { getMockAxiosInstance } from './api-client-mock-helpers';

export function describeApiResponseStructure(): void {
  describe('ApiResponse structure', () => {
    it('returns success response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: { test: 'data' },
      });

      const result = await apiClient.get('/test');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result).not.toHaveProperty('error');
    });

    it('returns error response', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue({
        message: 'Error',
      });

      const result = await apiClient.get('/test');

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('timestamp');
      expect(result).not.toHaveProperty('data');
    });

    it('includes timestamp in ISO format', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({ data: {} });

      const result = await apiClient.get('/test');

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('error response includes code, message, details', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue({
        message: 'Test error',
        stack: 'Error stack',
      });

      const result = await apiClient.get('/test');

      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('details');
    });
  });
}

export function describeIntegrationScenarios(): void {
  describe('Integration scenarios', () => {
    it('handles full request lifecycle', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: { success: true, id: 1 },
      });

      const result = await apiClient.get<{ success: boolean; id: number }>(
        '/api/users/1'
      );

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.id).toBe(1);
      expect(result.timestamp).toBeDefined();
    });

    it('handles error response with details', async () => {
      const mockAxiosInstance = getMockAxiosInstance();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { errors: ['Field is required'] },
        },
      });

      const result = await apiClient.post('/api/users', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('400');
      expect(result.error?.message).toBe('Bad Request');
      expect(result.error?.details).toEqual({ errors: ['Field is required'] });
    });
  });
}
