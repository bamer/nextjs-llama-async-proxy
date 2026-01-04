import { apiService } from '@/services/api-service';
import { mockApiClient, mockStore, setupMockStore } from './test-utils';

describe('api-service - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe('error handling', () => {
    it('should throw descriptive errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network failure'));

      await expect(apiService.getModels()).rejects.toThrow('Network failure');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as unknown as { code: string }).code = 'ECONNABORTED';

      mockApiClient.get.mockRejectedValue(timeoutError);

      await expect(apiService.getModels()).rejects.toThrow();
    });
  });

  describe('integration', () => {
    it('should support full model lifecycle', async () => {
      const loadResponse = {
        success: true,
        data: { loaded: true },
        timestamp: new Date().toISOString(),
      };

      const unloadResponse = {
        success: true,
        data: { unloaded: true },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValueOnce(loadResponse).mockResolvedValueOnce(unloadResponse);

      await apiService.loadModel('model1');
      await apiService.unloadModel('model1');

      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });
  });
});
