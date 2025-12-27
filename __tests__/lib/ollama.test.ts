import axios from 'axios';
import { listModels, pullModel, stopModel, ensureModel } from '@/lib/ollama';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ollama.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variable
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
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await listModels();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tags');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(listModels()).rejects.toThrow('Network Error');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tags');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout' };
      mockedAxios.get.mockRejectedValue(timeoutError);

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

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await pullModel(modelName);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle pull errors', async () => {
      const modelName = 'nonexistent-model';
      const error = { response: { status: 404, data: { error: 'Model not found' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(pullModel(modelName)).rejects.toEqual(error);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
    });

    it('should handle network errors during pull', async () => {
      const modelName = 'llama2';
      const error = new Error('Connection failed');
      mockedAxios.post.mockRejectedValue(error);

      await expect(pullModel(modelName)).rejects.toThrow('Connection failed');
    });
  });

  describe('stopModel', () => {
    it('should successfully stop a model', async () => {
      const modelName = 'llama2';
      const mockResponse = {
        data: { status: 'success' }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await stopModel(modelName);

      expect(mockedAxios.post).toHaveBeenCalledWith(`/api/models/${encodeURIComponent(modelName)}/stop`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle stopping non-existent model', async () => {
      const modelName = 'nonexistent';
      const error = { response: { status: 404, data: { error: 'Model not running' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(stopModel(modelName)).rejects.toEqual(error);
      expect(mockedAxios.post).toHaveBeenCalledWith(`/api/models/${encodeURIComponent(modelName)}/stop`);
    });

    it('should handle model names with special characters', async () => {
      const modelName = 'model with spaces & symbols';
      const mockResponse = { data: { status: 'success' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await stopModel(modelName);

      expect(mockedAxios.post).toHaveBeenCalledWith(`/api/models/${encodeURIComponent(modelName)}/stop`);
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

      mockedAxios.get.mockResolvedValue(mockModelsResponse);

      const result = await ensureModel(modelName);

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tags');
      expect(mockedAxios.post).not.toHaveBeenCalled();
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

      mockedAxios.get.mockResolvedValue(mockModelsResponse);
      mockedAxios.post.mockResolvedValue(mockPullResponse);

      const result = await ensureModel(modelName);

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/tags');
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
      expect(result).toEqual({ status: 'pulled' });
    });

    it('should handle empty models list', async () => {
      const modelName = 'first-model';
      const mockModelsResponse = { data: { models: [] } };
      const mockPullResponse = { data: { status: 'success' } };

      mockedAxios.get.mockResolvedValue(mockModelsResponse);
      mockedAxios.post.mockResolvedValue(mockPullResponse);

      const result = await ensureModel(modelName);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
      expect(result).toEqual({ status: 'pulled' });
    });

    it('should handle errors when checking existing models', async () => {
      const modelName = 'test-model';
      const error = new Error('Failed to list models');
      mockedAxios.get.mockRejectedValue(error);

      await expect(ensureModel(modelName)).rejects.toThrow('Failed to list models');
      expect(mockedAxios.post).not.toHaveBeenCalled();
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
      mockedAxios.get.mockResolvedValue(mockModelsResponse);
      mockedAxios.post.mockRejectedValue(pullError);

      await expect(ensureModel(modelName)).rejects.toThrow('Failed to pull model');
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/pull', { name: modelName });
    });
  });

  describe('axios configuration', () => {
    it('should use default base URL when OLLAMA_HOST is not set', () => {
      delete process.env.OLLAMA_HOST;
      
      // Re-import to test configuration
      jest.clearAllMocks();
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:11434',
        timeout: 30000
      });
    });

    it('should use custom base URL from OLLAMA_HOST environment variable', () => {
      process.env.OLLAMA_HOST = 'http://custom-ollama:8080';
      
      // Re-import to test configuration
      jest.clearAllMocks();
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://custom-ollama:8080',
        timeout: 30000
      });
    });
  });
});
