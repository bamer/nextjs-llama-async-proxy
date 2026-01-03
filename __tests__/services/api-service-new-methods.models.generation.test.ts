import { apiService } from '@/services/api-service';
import { apiClient } from '@/utils/api-client';
import { useStore } from '@/lib/store';
import {
  setupApiTests,
  createMockResponse,
} from '../services/api-service-test-helper';

// Mock apiClient properly before importing
jest.mock('@/utils/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock store
jest.mock('@/lib/store', () => ({
  useStore: {
    getState: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockStore = useStore as jest.Mocked<typeof useStore>;

setupApiTests(mockStore);

describe('api-service - Generation', () => {
  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const mockData = {
        text: 'Generated text',
        model: 'llama-2',
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({
        prompt: 'Hello',
        model: 'llama-2',
        max_tokens: 100,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/generate', {
        prompt: 'Hello',
        model: 'llama-2',
        max_tokens: 100,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle generation errors', async () => {
      const mockResponse = createMockResponse(false, {
        code: '500',
        message: 'Generation failed',
      });

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({ prompt: 'Test' } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Generation failed');
    });
  });

  describe('chat', () => {
    it('should handle chat request', async () => {
      const mockData = {
        message: 'Chat response',
        model: 'llama-2',
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-2',
        max_tokens: 100,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/chat', {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-2',
        max_tokens: 100,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
