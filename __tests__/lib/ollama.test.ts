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

    // Get the mock functions from the axios mock module
    const mockAxios = require('axios');
    mockGet = mockAxios.mockGet;
    mockPost = mockAxios.mockPost;

    // Clear previous mock calls
    mockGet.mockClear();
    mockPost.mockClear();
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

    // Positive: Test with model name containing special characters
    it('should handle model names with special characters', async () => {
      const modelName = 'model-with_special.chars';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      await pullModel(modelName);

      expect(mockPost).toHaveBeenCalledWith('/api/pull', { name: modelName });
    });

    // Positive: Test pull returns correct status
    it('should return pull status', async () => {
      const modelName = 'llama2';
      const mockResponse = {
        data: { status: 'downloading', progress: 50 },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await pullModel(modelName);

      expect(result.status).toBe('downloading');
      expect(result.progress).toBe(50);
    });

    // Negative: Test pull with empty model name
    it('should handle empty model name', async () => {
      const modelName = '';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      const result = await pullModel(modelName);

      expect(result).toEqual(mockResponse.data);
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

    // Positive: Test URL encoding of model name
    it('should URL encode model name', async () => {
      const modelName = 'model with spaces';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      await stopModel(modelName);

      expect(mockPost).toHaveBeenCalledWith(
        '/api/models/model%20with%20spaces/stop',
        undefined
      );
    });

    // Positive: Test stop returns correct response
    it('should return stop response', async () => {
      const modelName = 'llama2';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      const result = await stopModel(modelName);

      expect(result).toEqual(mockResponse.data);
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

    // Positive: Test ensureModel with 500 error
    it('should handle 500 errors during ensureModel', async () => {
      const modelName = 'new-model';
      const mockListResponse = { data: { models: [] } };
      const error = {
        response: { status: 500, data: { error: 'Internal Server Error' } },
      };

      mockGet.mockResolvedValue(mockListResponse);
      mockPost.mockRejectedValue(error);

      await expect(ensureModel(modelName)).rejects.toEqual(error);
    });

    // Positive: Test ensureModel with 400 error
    it('should handle 400 errors during ensureModel', async () => {
      const modelName = 'invalid-model';
      const error = {
        response: { status: 400, data: { error: 'Bad Request' } },
      };

      mockGet.mockRejectedValue(error);

      await expect(ensureModel(modelName)).rejects.toEqual(error);
    });

    // Positive: Test ensureModel with 404 error
    it('should handle 404 errors during ensureModel', async () => {
      const modelName = 'not-found';
      const error = {
        response: { status: 404, data: { error: 'Not Found' } },
      };

      mockGet.mockRejectedValue(error);

      await expect(ensureModel(modelName)).rejects.toEqual(error);
    });

    // Negative: Test concurrent ensureModel calls
    it('should handle concurrent ensureModel calls', async () => {
      const mockListResponse = { data: { models: [] } };
      const mockPullResponse = { data: { status: 'success' } };

      mockGet.mockResolvedValue(mockListResponse);
      mockPost.mockResolvedValue(mockPullResponse);

      const results = await Promise.all([
        ensureModel('model1'),
        ensureModel('model2'),
        ensureModel('model3'),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toEqual({ status: 'pulled' });
      });
    });

    // Negative: Test ensureModel with network timeout
    it('should handle network timeout during ensureModel', async () => {
      const modelName = 'timeout-model';
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout' };

      mockGet.mockRejectedValue(timeoutError);

      await expect(ensureModel(modelName)).rejects.toEqual(timeoutError);
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

    // Positive: Test with very long model names
    it('should handle very long model names', async () => {
      const longName = 'a'.repeat(1000);
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      const result = await pullModel(longName);

      expect(result).toEqual(mockResponse.data);
    });

    // Negative: Test with special characters in model names
    it('should handle special characters in model names', async () => {
      const specialName = 'model@#$%^&*()';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      const result = await pullModel(specialName);

      expect(result).toEqual(mockResponse.data);
    });

    // Negative: Test with unicode characters in model names
    it('should handle unicode characters in model names', async () => {
      const unicodeName = '模型';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      const result = await pullModel(unicodeName);

      expect(result).toEqual(mockResponse.data);
    });

    // Negative: Test with null model name
    it('should handle null model name', async () => {
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      const result = await pullModel(null as any);

      expect(result).toEqual(mockResponse.data);
    });

    // Negative: Test with undefined model name
    it('should handle undefined model name', async () => {
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      const result = await pullModel(undefined as any);

      expect(result).toEqual(mockResponse.data);
    });

    // Positive: Test rapid consecutive calls
    it('should handle rapid consecutive API calls', async () => {
      const mockResponse = { data: { models: [] } };

      mockGet.mockResolvedValue(mockResponse);

      const promises = Array(100)
        .fill(null)
        .map(() => listModels());

      await Promise.all(promises);

      expect(mockGet).toHaveBeenCalledTimes(100);
    });

    // Positive: Test API response with extra fields
    it('should handle API response with extra fields', async () => {
      const mockResponse = {
        data: {
          models: [{ name: 'llama2', extraField: 'value' }],
          timestamp: '2024-01-01',
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await listModels();

      expect(result).toEqual(mockResponse.data);
    });

    // Negative: Test API response with undefined data
    it('should handle API response with undefined data', async () => {
      const mockResponse = { data: undefined };

      mockGet.mockResolvedValue(mockResponse);

      const result = await listModels();

      expect(result).toBeUndefined();
    });

    // Positive: Test stopModel with URL path traversal attempts
    it('should handle URL path traversal in model names', async () => {
      const maliciousName = '../../../etc/passwd';
      const mockResponse = { data: { status: 'success' } };

      mockPost.mockResolvedValue(mockResponse);

      await stopModel(maliciousName);

      expect(mockPost).toHaveBeenCalledWith(
        `/api/models/${encodeURIComponent(maliciousName)}/stop`,
        undefined
      );
    });

    // Negative: Test API connection refused
    it('should handle connection refused errors', async () => {
      const error = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' };

      mockGet.mockRejectedValue(error);

      await expect(listModels()).rejects.toEqual(error);
    });

    // Negative: Test API DNS resolution failure
    it('should handle DNS resolution failure', async () => {
      const error = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' };

      mockGet.mockRejectedValue(error);

      await expect(listModels()).rejects.toEqual(error);
    });
  });
});
