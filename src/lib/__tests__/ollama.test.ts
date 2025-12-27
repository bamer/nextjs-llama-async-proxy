import { listModels, pullModel, stopModel, ensureModel } from '@/lib/ollama';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ollama', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listModels', () => {
    it('should fetch and return models from Ollama API', async () => {
      const mockResponse = {
        models: [
          { name: 'llama2', modified_at: '2024-01-01T00:00:00Z' },
          { name: 'mistral', modified_at: '2024-01-02T00:00:00Z' },
        ],
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponse }),
      } as any);

      const result = await listModels();

      expect(result).toEqual(mockResponse);
    });

    it('should use custom OLLAMA_HOST if set in environment', () => {
      const originalHost = process.env.OLLAMA_HOST;
      process.env.OLLAMA_HOST = 'http://custom-host:11435';

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: { models: [] } }),
      } as any);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://custom-host:11435',
          timeout: 30000,
        })
      );

      process.env.OLLAMA_HOST = originalHost;
    });

    it('should use default localhost URL when OLLAMA_HOST is not set', () => {
      const originalHost = process.env.OLLAMA_HOST;
      delete process.env.OLLAMA_HOST;

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: { models: [] } }),
      } as any);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:11434',
          timeout: 30000,
        })
      );

      if (originalHost) {
        process.env.OLLAMA_HOST = originalHost;
      }
    });
  });

  describe('pullModel', () => {
    it('should pull a model and return response', async () => {
      const mockResponse = {
        status: 'pulling manifest',
        digest: 'sha256:abc123',
        total: 1000000,
        completed: 500000,
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
      } as any);

      const result = await pullModel('llama2');

      expect(result).toEqual(mockResponse);
    });

    it('should send model name in request body', async () => {
      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({ data: {} }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      await pullModel('mistral');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/pull', {
        name: 'mistral',
      });
    });
  });

  describe('stopModel', () => {
    it('should stop a model and return response', async () => {
      const mockResponse = { success: true };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
      } as any);

      const result = await stopModel('llama2');

      expect(result).toEqual(mockResponse);
    });

    it('should URL encode model name in request path', async () => {
      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue({ data: {} }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      await stopModel('llama2:latest');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/models/llama2%3Alatest/stop'
      );
    });
  });

  describe('ensureModel', () => {
    it('should return present status when model already exists', async () => {
      const mockTags = {
        models: [
          { name: 'llama2', modified_at: '2024-01-01T00:00:00Z' },
          { name: 'mistral', modified_at: '2024-01-02T00:00:00Z' },
        ],
      };

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: mockTags }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const result = await ensureModel('llama2');

      expect(result).toEqual({ status: 'present' });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/tags');
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should pull model when it does not exist', async () => {
      const mockTags = {
        models: [
          { name: 'llama2', modified_at: '2024-01-01T00:00:00Z' },
        ],
      };

      const mockPullResponse = { status: 'success' };

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: mockTags }),
        post: jest.fn().mockResolvedValue({ data: mockPullResponse }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const result = await ensureModel('mistral');

      expect(result).toEqual({ status: 'pulled' });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/tags');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/pull', {
        name: 'mistral',
      });
    });

    it('should handle empty models list', async () => {
      const mockTags = { models: [] };
      const mockPullResponse = { status: 'success' };

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: mockTags }),
        post: jest.fn().mockResolvedValue({ data: mockPullResponse }),
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const result = await ensureModel('llama2');

      expect(result).toEqual({ status: 'pulled' });
    });
  });
});
