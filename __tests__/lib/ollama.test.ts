import axios from 'axios';
import { listModels, pullModel, stopModel, ensureModel } from '@/lib/ollama';

const mockApi: any = {
  get: jest.fn(),
  post: jest.fn(),
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockApi),
  default: {
    create: jest.fn(() => mockApi),
  },
}));

describe('ollama.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockClear();
    mockApi.post.mockClear();
    delete process.env.OLLAMA_HOST;
  });

  describe('listModels', () => {
    it('should successfully list models', async () => {
      const mockResponse = {
        data: {
          models: [
            { name: 'llama2', size: 1000000, modified_at: '2023-01-01' },
            { name: 'codellama', size: 2000000, modified_at: '2023-01-02' }
          ]
        }
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await listModels();

      expect(mockApi.get).toHaveBeenCalledWith('/api/tags');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network Error');
      mockApi.get.mockRejectedValue(error);

      await expect(listModels()).rejects.toThrow('Network Error');
      expect(mockApi.get).toHaveBeenCalledWith('/api/tags');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout' };
      mockApi.get.mockRejectedValue(timeoutError);

      await expect(listModels()).rejects.toEqual(timeoutError);
    });
  });

  describe('pullModel', () => {
    it('should successfully pull a model', async () => {
      const modelName = 'llama2';
      const mockResponse = {
        data: {
          status: 'success',
          digest: 'sha256:123456789',
          total: 1000000
        }
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await pullModel(modelName);

      expect(mockApi.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle pull errors', async () => {
      const modelName = 'nonexistent-model';
      const error = { response: { status: 404, data: { error: 'Model not found' } } };
      mockApi.post.mockRejectedValue(error);

      await expect(pullModel(modelName)).rejects.toEqual(error);
      expect(mockApi.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
    });

    it('should handle network errors during pull', async () => {
      const modelName = 'llama2';
      const error = new Error('Connection failed');
      mockApi.post.mockRejectedValue(error);

      await expect(pullModel(modelName)).rejects.toThrow('Connection failed');
    });
  });

  describe('stopModel', () => {
    it('should successfully stop a model', async () => {
      const modelName = 'llama2';
      const mockResponse = {
        data: { status: 'success' }
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await stopModel(modelName);

      expect(mockApi.post).toHaveBeenCalledWith(`/api/models/${encodeURIComponent(modelName)}/stop`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle stopping non-existent model', async () => {
      const modelName = 'nonexistent';
      const error = { response: { status: 404, data: { error: 'Model not running' } } };
      mockApi.post.mockRejectedValue(error);

      await expect(stopModel(modelName)).rejects.toEqual(error);
      expect(mockApi.post).toHaveBeenCalledWith(`/api/models/${encodeURIComponent(modelName)}/stop`);
    });

    it('should handle model names with special characters', async () => {
      const modelName = 'model with spaces & symbols';
      const mockResponse = { data: { status: 'success' } };
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await stopModel(modelName);

      expect(mockApi.post).toHaveBeenCalledWith(`/api/models/${encodeURIComponent(modelName)}/stop`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('ensureModel', () => {
    it('should return present status when model already exists', async () => {
      const modelName = 'existing-model';
      const mockModelsResponse = {
        data: {
          models: [
            { name: modelName, size: 1000000 },
            { name: 'other-model', size: 2000000 }
          ]
        }
      };

      mockApi.get.mockResolvedValue(mockModelsResponse);

      const result = await ensureModel(modelName);

      expect(mockApi.get).toHaveBeenCalledWith('/api/tags');
      expect(mockApi.post).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'present' });
    });

    it('should pull model when not present', async () => {
      const modelName = 'new-model';
      const mockModelsResponse = {
        data: {
          models: [
            { name: 'existing-model', size: 1000000 }
          ]
        }
      };
      const mockPullResponse = {
        data: {
          status: 'success',
          digest: 'sha256:new123'
        }
      };

      mockApi.get.mockResolvedValue(mockModelsResponse);
      mockApi.post.mockResolvedValue(mockPullResponse);

      const result = await ensureModel(modelName);

      expect(mockApi.get).toHaveBeenCalledWith('/api/tags');
      expect(mockApi.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
      expect(result).toEqual({ status: 'pulled' });
    });

    it('should handle empty models list', async () => {
      const modelName = 'first-model';
      const mockModelsResponse = { data: { models: [] } };
      const mockPullResponse = { data: { status: 'success' } };

      mockApi.get.mockResolvedValue(mockModelsResponse);
      mockApi.post.mockResolvedValue(mockPullResponse);

      const result = await ensureModel(modelName);

      expect(mockApi.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
      expect(result).toEqual({ status: 'pulled' });
    });

    it('should handle errors when checking existing models', async () => {
      const modelName = 'test-model';
      const error = new Error('Failed to list models');
      mockApi.get.mockRejectedValue(error);

      await expect(ensureModel(modelName)).rejects.toThrow('Failed to list models');
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('should handle errors during pull operation', async () => {
      const modelName = 'new-model';
      const mockModelsResponse = {
        data: {
          models: [
            { name: 'existing-model', size: 1000000 }
          ]
        }
      };
      const pullError = new Error('Failed to pull model');
      mockApi.get.mockResolvedValue(mockModelsResponse);
      mockApi.post.mockRejectedValue(pullError);

      await expect(ensureModel(modelName)).rejects.toThrow('Failed to pull model');
      expect(mockApi.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
    });
  });
});
