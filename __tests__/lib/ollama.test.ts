import axios from 'axios';
import {
  listModels,
  pullModel,
  stopModel,
  ensureModel,
} from '@/lib/ollama';

jest.mock('axios');

describe('ollama.ts', () => {
  let mockGet: jest.Mock;
  let mockPost: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.resetModules();

    mockGet = jest.fn();
    mockPost = jest.fn();

    (axios.create as jest.Mock).mockReturnValue({
      get: mockGet,
      post: mockPost,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('listModels', () => {
    // Positive test: Successfully list models from Ollama
    it('should successfully list models from Ollama', async () => {
      const mockResponse = {
        data: {
          models: [
            { name: 'llama2', size: 1000000, modified_at: '2023-01-01' },
            { name: 'codellama', size: 2000000, modified_at: '2023-01-02' },
          ],
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await listModels();

      expect(mockGet).toHaveBeenCalledWith('/api/tags');
      expect(result).toEqual(mockResponse.data);
    });

    // Positive test: Handle empty models list
    it('should handle empty models list', async () => {
      const mockResponse = {
        data: { models: [] },
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await listModels();

      expect(result).toEqual({ models: [] });
    });

    // Negative test: Throw error on API failure
    it('should throw error on API failure', async () => {
      const error = new Error('Network Error');
      mockGet.mockRejectedValue(error);

      await expect(listModels()).rejects.toThrow('Network Error');
    });

    // Negative test: Handle timeout errors
    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout' };
      mockGet.mockRejectedValue(timeoutError);

      await expect(listModels()).rejects.toEqual(timeoutError);
    });

    // Edge case: Use correct base URL from environment
    it('should use correct base URL from environment', async () => {
      const originalHost = process.env.OLLAMA_HOST;
      process.env.OLLAMA_HOST = 'http://custom-host:11434';

      const mockResponse = { data: { models: [] } };
      mockGet.mockResolvedValue(mockResponse);

      await listModels();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://custom-host:11434',
        })
      );

      if (originalHost !== undefined) {
        process.env.OLLAMA_HOST = originalHost;
      } else {
        delete process.env.OLLAMA_HOST;
      }
    });

    // Edge case: Ensure correct timeout is used
    it('should ensure correct timeout is used', async () => {
      const mockResponse = { data: { models: [] } };
      mockGet.mockResolvedValue(mockResponse);

      await listModels();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });
  });

  describe('pullModel', () => {
    // Positive test: Successfully pull a model
    it('should successfully pull a model', async () => {
      const modelName = 'llama2';
      const mockResponse = {
        data: { status: 'success', digest: 'sha256:123456789' },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await pullModel(modelName);

      expect(result).toEqual(mockResponse.data);
    });

    // Positive test: Send correct payload with model name
    it('should send correct payload with model name', async () => {
      const modelName = 'test-model';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      await pullModel(modelName);

      expect(mockPost).toHaveBeenCalledWith('/api/pull', { name: modelName });
    });

    // Negative test: Handle pull errors
    it('should handle pull errors', async () => {
      const modelName = 'nonexistent-model';
      const error = {
        response: { status: 404, data: { error: 'Model not found' } },
      };
      mockPost.mockRejectedValue(error);

      await expect(pullModel(modelName)).rejects.toEqual(error);
    });

    // Negative test: Handle network errors during pull
    it('should handle network errors during pull', async () => {
      const modelName = 'llama2';
      const error = new Error('Connection failed');
      mockPost.mockRejectedValue(error);

      await expect(pullModel(modelName)).rejects.toThrow('Connection failed');
    });
  });

  describe('stopModel', () => {
    // Positive test: Successfully stop a model
    it('should successfully stop a model', async () => {
      const modelName = 'llama2';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      const result = await stopModel(modelName);

      expect(result).toEqual(mockResponse.data);
    });

    // Positive test: Handle model names with special characters
    it('should handle model names with special characters', async () => {
      const modelName = 'model with spaces & symbols';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      await stopModel(modelName);

      expect(mockPost).toHaveBeenCalledWith(
        `/api/models/${encodeURIComponent(modelName)}/stop`,
        undefined
      );
    });

    // Negative test: Handle stopping non-existent model
    it('should handle stopping non-existent model', async () => {
      const modelName = 'nonexistent';
      const error = {
        response: { status: 404, data: { error: 'Model not running' } },
      };
      mockPost.mockRejectedValue(error);

      await expect(stopModel(modelName)).rejects.toEqual(error);
    });
  });

  describe('ensureModel', () => {
    // Positive test: Return present status when model already exists
    it('should return present status when model already exists', async () => {
      const modelName = 'existing-model';
      const mockListResponse = {
        data: {
          models: [{ name: modelName, size: 1000000 }],
        },
      };

      mockGet.mockResolvedValue(mockListResponse);

      const result = await ensureModel(modelName);

      expect(result).toEqual({ status: 'present' });
      expect(mockPost).not.toHaveBeenCalled();
    });

    // Positive test: Pull model when not present
    it('should pull model when not present', async () => {
      const modelName = 'new-model';
      const mockListResponse = { data: { models: [] } };
      const mockPullResponse = { data: { status: 'success' } };

      mockGet.mockResolvedValue(mockListResponse);
      mockPost.mockResolvedValue(mockPullResponse);

      const result = await ensureModel(modelName);

      expect(result).toEqual({ status: 'pulled' });
      expect(mockGet).toHaveBeenCalledWith('/api/tags');
      expect(mockPost).toHaveBeenCalledWith('/api/pull', { name: modelName });
    });

    // Positive test: Find model among multiple models
    it('should find model among multiple models', async () => {
      const modelName = 'codellama';
      const mockListResponse = {
        data: {
          models: [
            { name: 'llama2', size: 1000000 },
            { name: 'codellama', size: 2000000 },
            { name: 'mistral', size: 3000000 },
          ],
        },
      };

      mockGet.mockResolvedValue(mockListResponse);

      const result = await ensureModel(modelName);

      expect(result).toEqual({ status: 'present' });
      expect(mockPost).not.toHaveBeenCalled();
    });

    // Negative test: Handle errors when checking existing models
    it('should handle errors when checking existing models', async () => {
      const modelName = 'test-model';
      const error = new Error('Failed to list models');
      mockGet.mockRejectedValue(error);

      await expect(ensureModel(modelName)).rejects.toThrow(
        'Failed to list models'
      );
    });

    // Negative test: Handle errors during pull operation
    it('should handle errors during pull operation', async () => {
      const modelName = 'new-model';
      const mockListResponse = { data: { models: [] } };
      const pullError = new Error('Failed to pull model');

      mockGet.mockResolvedValue(mockListResponse);
      mockPost.mockRejectedValue(pullError);

      await expect(ensureModel(modelName)).rejects.toThrow(
        'Failed to pull model'
      );
    });

    // Edge case: Model name with different case
    it('should be case sensitive when checking model existence', async () => {
      const modelName = 'Llama2';
      const mockListResponse = {
        data: { models: [{ name: 'llama2', size: 1000000 }] },
      };

      mockGet.mockResolvedValue(mockListResponse);
      mockPost.mockResolvedValue({ data: { status: 'success' } });

      const result = await ensureModel(modelName);

      expect(result).toEqual({ status: 'pulled' });
      expect(mockPost).toHaveBeenCalled();
    });

    // Edge case: Handle empty models list
    it('should handle empty models list', async () => {
      const modelName = 'first-model';
      const mockListResponse = { data: { models: [] } };
      const mockPullResponse = { data: { status: 'success' } };

      mockGet.mockResolvedValue(mockListResponse);
      mockPost.mockResolvedValue(mockPullResponse);

      const result = await ensureModel(modelName);

      expect(result).toEqual({ status: 'pulled' });
      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    // Edge case: Handle malformed API responses
    it('should handle malformed API responses', async () => {
      const mockResponse = { data: null };
      mockGet.mockResolvedValue(mockResponse);

      const result = await listModels();
      expect(result).toBeNull();
    });

    // Edge case: Handle API responses without models array
    it('should handle API responses without models array', async () => {
      const mockResponse = { data: { message: 'OK' } };
      mockGet.mockResolvedValue(mockResponse);

      const result = await listModels();
      expect(result).toEqual({ message: 'OK' });
    });
  });
});
