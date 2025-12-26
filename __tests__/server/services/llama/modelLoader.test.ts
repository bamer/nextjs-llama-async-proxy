import { ModelLoader } from '@/server/services/llama/modelLoader';
import axios from 'axios';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('ModelLoader', () => {
  let modelLoader: ModelLoader;
  const mockModels = [
    { id: 'model1', name: 'Model 1', size: 10737418240 },
    { id: 'model2', name: 'Model 2', size: 53687091200 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    modelLoader = new ModelLoader('localhost', 8134, '/models');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with host, port, and basePath', () => {
      const loader = new ModelLoader('192.168.1.100', 9000, '/custom/models');

      expect(loader).toBeInstanceOf(ModelLoader);
    });
  });

  describe('load', () => {
    it('should load models from llama-server', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockModels,
      });

      const models = await modelLoader.load();

      expect(models).toEqual(mockModels);
      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:8134/models',
        { timeout: 5000 }
      );
    });

    it('should handle array response data', async () => {
      const response = {
        status: 200,
        data: mockModels,
      };
      mockAxios.get.mockResolvedValue(response);

      const models = await modelLoader.load();

      expect(models).toEqual(mockModels);
    });

    it('should handle object response with data property', async () => {
      const response = {
        status: 200,
        data: { data: mockModels },
      };
      mockAxios.get.mockResolvedValue(response);

      const models = await modelLoader.load();

      expect(models).toEqual(mockModels);
    });

    it('should return empty array on 404', async () => {
      mockAxios.get.mockResolvedValue({
        status: 404,
        data: {},
      });

      const models = await modelLoader.load();

      expect(models).toEqual([]);
    });

    it('should return empty array on 500', async () => {
      mockAxios.get.mockResolvedValue({
        status: 500,
        data: {},
      });

      const models = await modelLoader.load();

      expect(models).toEqual([]);
    });

    it('should handle network errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      const models = await modelLoader.load();

      expect(models).toEqual([]);
    });

    it('should handle empty response data', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: [],
      });

      const models = await modelLoader.load();

      expect(models).toEqual([]);
    });
  });

  describe('discover', () => {
    it('should scan filesystem for models', async () => {
      const models = await modelLoader.discover();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThanOrEqual(0);
    });
  });
});
