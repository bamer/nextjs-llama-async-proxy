import { apiService } from '@/services/api-service';
import { apiClient } from '@/utils/api-client';
import { useStore } from '@/lib/store';
import {
  setupApiTests,
  createMockResponse,
  createMockModel,
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

describe('api-service - Models Management', () => {

  describe('getModelTemplates', () => {
    it('should return model templates', async () => {
      const mockData = {
        model_templates: {
          template1: { name: 'Template 1' },
          template2: { name: 'Template 2' },
        },
        default_model: 'template1',
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getModelTemplates();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/model-templates');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('saveModelTemplates', () => {
    it('should save model templates successfully', async () => {
      const mockData = {
        model_templates: {
          template1: { name: 'Template 1' },
        },
        default_model: 'template1',
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.post.mockResolvedValue(mockResponse);

      const templates = { template1: { name: 'Template 1' } };

      const result = await apiService.saveModelTemplates(templates);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/model-templates', {
        model_templates: templates,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle save errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Save failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(apiService.saveModelTemplates({})).rejects.toThrow('Save failed');
    });
  });

  describe('getLlamaModels', () => {
    it('should return llama models', async () => {
      const mockData = {
        models: [
          createMockModel('model1', 'Model 1', 'idle'),
          createMockModel('model2', 'Model 2', 'running'),
        ],
      };
      const mockResponse = createMockResponse(true, mockData);

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiService.getLlamaModels();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/models');
      expect(result).toEqual(mockResponse);
      expect(mockStore.getState().setModels).toHaveBeenCalledWith(mockResponse.data.models);
    });

    it('should handle get llama models errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: '500',
          message: 'Fetch failed',
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await expect(apiService.getLlamaModels()).rejects.toThrow('Fetch failed');
    });
  });
});
