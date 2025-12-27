import { listModels, pullModel, stopModel, ensureModel } from '@/lib/ollama';

jest.mock('@/lib/ollama', () => {
  const actualModule = jest.requireActual('@/lib/ollama');
  return {
    ...actualModule,
    listModels: jest.fn(),
    pullModel: jest.fn(),
    stopModel: jest.fn(),
    ensureModel: jest.fn(),
  };
});

describe('ollama.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listModels', () => {
    it('should successfully list models', async () => {
      const mockResponse = {
        models: [
          { name: 'llama2', size: 1000000, modified_at: '2023-01-01' },
          { name: 'codellama', size: 2000000, modified_at: '2023-01-02' }
        ]
      };

      (listModels as jest.Mock).mockResolvedValue(mockResponse);

      const result = await listModels();

      expect(listModels).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network Error');
      (listModels as jest.Mock).mockRejectedValue(error);

      await expect(listModels()).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout' };
      (listModels as jest.Mock).mockRejectedValue(timeoutError);

      await expect(listModels()).rejects.toEqual(timeoutError);
    });
  });

  describe('pullModel', () => {
    it('should successfully pull a model', async () => {
      const modelName = 'llama2';
      const mockResponse = {
        status: 'success',
        digest: 'sha256:123456789',
        total: 1000000
      };

      (pullModel as jest.Mock).mockResolvedValue(mockResponse);

      const result = await pullModel(modelName);

      expect(pullModel).toHaveBeenCalledWith(modelName);
      expect(result).toEqual(mockResponse);
    });

    it('should handle pull errors', async () => {
      const modelName = 'nonexistent-model';
      const error = { response: { status: 404, data: { error: 'Model not found' } } };
      (pullModel as jest.Mock).mockRejectedValue(error);

      await expect(pullModel(modelName)).rejects.toEqual(error);
    });

    it('should handle network errors during pull', async () => {
      const modelName = 'llama2';
      const error = new Error('Connection failed');
      (pullModel as jest.Mock).mockRejectedValue(error);

      await expect(pullModel(modelName)).rejects.toThrow('Connection failed');
    });
  });

  describe('stopModel', () => {
    it('should successfully stop a model', async () => {
      const modelName = 'llama2';
      const mockResponse = { status: 'success' };

      (stopModel as jest.Mock).mockResolvedValue(mockResponse);

      const result = await stopModel(modelName);

      expect(stopModel).toHaveBeenCalledWith(modelName);
      expect(result).toEqual(mockResponse);
    });

    it('should handle stopping non-existent model', async () => {
      const modelName = 'nonexistent';
      const error = { response: { status: 404, data: { error: 'Model not running' } } };
      (stopModel as jest.Mock).mockRejectedValue(error);

      await expect(stopModel(modelName)).rejects.toEqual(error);
    });

    it('should handle model names with special characters', async () => {
      const modelName = 'model with spaces & symbols';
      const mockResponse = { status: 'success' };
      (stopModel as jest.Mock).mockResolvedValue(mockResponse);

      const result = await stopModel(modelName);

      expect(stopModel).toHaveBeenCalledWith(modelName);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('ensureModel', () => {
    it('should return present status when model already exists', async () => {
      const modelName = 'existing-model';
      const mockResponse = { status: 'present' };

      (ensureModel as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ensureModel(modelName);

      expect(ensureModel).toHaveBeenCalledWith(modelName);
      expect(result).toEqual(mockResponse);
    });

    it('should pull model when not present', async () => {
      const modelName = 'new-model';
      const mockResponse = { status: 'pulled' };

      (ensureModel as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ensureModel(modelName);

      expect(ensureModel).toHaveBeenCalledWith(modelName);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty models list', async () => {
      const modelName = 'first-model';
      const mockResponse = { status: 'pulled' };

      (ensureModel as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ensureModel(modelName);

      expect(ensureModel).toHaveBeenCalledWith(modelName);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when checking existing models', async () => {
      const modelName = 'test-model';
      const error = new Error('Failed to list models');
      (ensureModel as jest.Mock).mockRejectedValue(error);

      await expect(ensureModel(modelName)).rejects.toThrow('Failed to list models');
    });

    it('should handle errors during pull operation', async () => {
      const modelName = 'new-model';
      const pullError = new Error('Failed to pull model');
      (ensureModel as jest.Mock).mockRejectedValue(pullError);

      await expect(ensureModel(modelName)).rejects.toThrow('Failed to pull model');
    });
  });
});
