import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { ModelLoader } from '@/server/services/llama/modelLoader';

jest.mock('axios');
jest.mock('fs');
jest.mock('path');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('ModelLoader', () => {
  let modelLoader: ModelLoader;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockedPath.resolve.mockImplementation((p: string) => p);
  });

  describe('constructor', () => {
    it('should create axios client with correct config', () => {
      const mockClient = {
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      modelLoader = new ModelLoader('localhost', 8080, '/path/to/models');

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it('should store base path', () => {
      const mockClient = { get: jest.fn() };
      mockedAxios.create.mockReturnValue(mockClient as any);

      modelLoader = new ModelLoader('localhost', 8080, '/path/to/models');

      expect((modelLoader as any).basePath).toBe('/path/to/models');
    });

    it('should handle undefined base path', () => {
      const mockClient = { get: jest.fn() };
      mockedAxios.create.mockReturnValue(mockClient as any);

      modelLoader = new ModelLoader('localhost', 8080);

      expect((modelLoader as any).basePath).toBeUndefined();
    });
  });

  describe('loadFromServer', () => {
    beforeEach(() => {
      const mockClient = {
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);
      modelLoader = new ModelLoader('localhost', 8080, '/path/to/models');
    });

    it('should load models from server with array response', async () => {
      const mockModels = [
        {
          id: 'model1',
          name: 'Model 1',
          size: 1000000000,
          type: 'gguf',
          path: '/path/to/model1.gguf',
        },
        {
          id: 'model2',
          name: 'Model 2',
          size: 2000000000,
          type: 'bin',
        },
      ];

      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockResolvedValue({
        status: 200,
        data: mockModels,
      });

      const models = await modelLoader.loadFromServer();

      expect(models).toHaveLength(2);
      expect(models[0]).toEqual({
        id: 'model1',
        name: 'model1',
        path: '/path/to/model1.gguf',
        size: 1000000000,
        type: 'gguf',
        modified_at: expect.any(Number),
      });
      expect(models[1]).toEqual({
        id: 'model2',
        name: 'model2',
        path: undefined,
        size: 2000000000,
        type: 'bin',
        modified_at: expect.any(Number),
      });
    });

    it('should load models from server with data property response', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'model1',
              name: 'Model 1',
              size: 1000000000,
              type: 'gguf',
            },
          ],
        },
      };

      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockResolvedValue({ status: 200, data: mockResponse.data });

      const models = await modelLoader.loadFromServer();

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('model1');
    });

    it('should handle models without id field', async () => {
      const mockModels = [
        {
          name: 'Model 1',
          size: 1000000000,
          type: 'gguf',
        },
      ];

      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockResolvedValue({
        status: 200,
        data: mockModels,
      });

      const models = await modelLoader.loadFromServer();

      expect(models[0].id).toBe('Model 1');
      expect(models[0].name).toBe('Model 1');
    });

    it('should return empty array for non-200 status', async () => {
      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockResolvedValue({
        status: 404,
        data: null,
      });

      const models = await modelLoader.loadFromServer();

      expect(models).toEqual([]);
    });

    it('should return empty array for null data', async () => {
      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockResolvedValue({
        status: 200,
        data: null,
      });

      const models = await modelLoader.loadFromServer();

      expect(models).toEqual([]);
    });

    it('should throw error on request failure', async () => {
      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockRejectedValue(new Error('Connection refused'));

      await expect(modelLoader.loadFromServer()).rejects.toThrow(
        'Failed to fetch models from server'
      );
    });

    it('should handle empty array response', async () => {
      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockResolvedValue({
        status: 200,
        data: [],
      });

      const models = await modelLoader.loadFromServer();

      expect(models).toEqual([]);
    });

    it('should handle non-array data response', async () => {
      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockResolvedValue({
        status: 200,
        data: { message: 'Not an array' },
      });

      const models = await modelLoader.loadFromServer();

      expect(models).toEqual([]);
    });
  });

  describe('loadFromFilesystem', () => {
    beforeEach(() => {
      const mockClient = { get: jest.fn() };
      mockedAxios.create.mockReturnValue(mockClient as any);
      modelLoader = new ModelLoader('localhost', 8080, '/path/to/models');
    });

    it('should return empty array when base path is not set', () => {
      const loaderWithoutPath = new ModelLoader('localhost', 8080);

      const models = loaderWithoutPath.loadFromFilesystem();

      expect(models).toEqual([]);
    });

    it('should return empty array when directory does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const models = modelLoader.loadFromFilesystem();

      expect(models).toEqual([]);
      expect(mockedFs.readdirSync).not.toHaveBeenCalled();
    });

    it('should load gguf files from filesystem', () => {
      mockedFs.existsSync.mockReturnValue(true);
      (mockedFs.readdirSync as jest.Mock).mockReturnValue(['model1.gguf', 'model2.gguf'] as any);
      (mockedFs.statSync as jest.Mock)
        .mockReturnValueOnce({
          size: 1000000000,
          mtimeMs: Date.now(),
        } as any)
        .mockReturnValueOnce({
          size: 2000000000,
          mtimeMs: Date.now(),
        } as any);

      const models = modelLoader.loadFromFilesystem();

      expect(models).toHaveLength(2);
      expect(models[0]).toEqual({
        id: 'model1.gguf',
        name: 'model1',
        size: 1000000000,
        type: 'gguf',
        modified_at: expect.any(Number),
      });
      expect(models[1]).toEqual({
        id: 'model2.gguf',
        name: 'model2',
        size: 2000000000,
        type: 'gguf',
        modified_at: expect.any(Number),
      });
    });

    it('should load bin files from filesystem', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(['model1.bin', 'model2.bin']);
      mockedFs.statSync
        .mockReturnValueOnce({
          size: 500000000,
          mtimeMs: Date.now(),
        } as any)
        .mockReturnValueOnce({
          size: 750000000,
          mtimeMs: Date.now(),
        } as any);

      const models = modelLoader.loadFromFilesystem();

      expect(models).toHaveLength(2);
      expect(models[0].type).toBe('bin');
      expect(models[1].type).toBe('bin');
    });

    it('should filter non-model files', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([
        'model1.gguf',
        'readme.txt',
        'model2.bin',
        'config.json',
      ]);
      mockedFs.statSync
        .mockReturnValueOnce({
          size: 1000000000,
          mtimeMs: Date.now(),
        } as any)
        .mockReturnValueOnce({
          size: 2000000000,
          mtimeMs: Date.now(),
        } as any);

      const models = modelLoader.loadFromFilesystem();

      expect(models).toHaveLength(2);
      expect(models.map((m) => m.name)).toEqual(['model1', 'model2']);
    });

    it('should handle filesystem errors gracefully', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const models = modelLoader.loadFromFilesystem();

      expect(models).toEqual([]);
    });

    it('should handle stat errors gracefully', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(['model.gguf']);
      mockedFs.statSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const models = modelLoader.loadFromFilesystem();

      expect(models).toEqual([]);
    });

    it('should handle empty directory', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([]);

      const models = modelLoader.loadFromFilesystem();

      expect(models).toEqual([]);
    });

    it('should convert file sizes correctly', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(['large-model.gguf']);
      mockedFs.statSync.mockReturnValue({
        size: 5000000000,
        mtimeMs: Date.now(),
      } as any);

      const models = modelLoader.loadFromFilesystem();

      expect(models[0].size).toBe(5000000000);
    });

    it('should convert modification time to timestamp', () => {
      const testTime = new Date('2024-01-01T00:00:00Z').getTime();
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(['model.gguf']);
      mockedFs.statSync.mockReturnValue({
        size: 1000000000,
        mtimeMs: testTime,
      } as any);

      const models = modelLoader.loadFromFilesystem();

      expect(models[0].modified_at).toBe(Math.floor(testTime / 1000));
    });
  });

  describe('load', () => {
    beforeEach(() => {
      const mockClient = { get: jest.fn() };
      mockedAxios.create.mockReturnValue(mockClient as any);
      modelLoader = new ModelLoader('localhost', 8080, '/path/to/models');
    });

    it('should load from server when successful', async () => {
      const mockModels = [
        {
          id: 'model1',
          name: 'Model 1',
          size: 1000000000,
          type: 'gguf',
        },
      ];

      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockResolvedValue({
        status: 200,
        data: mockModels,
      });

      const models = await modelLoader.load();

      expect(models).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith('/models');
    });

    it('should fallback to filesystem when server fails', async () => {
      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockRejectedValue(new Error('Connection refused'));

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(['model1.gguf']);
      mockedFs.statSync.mockReturnValue({
        size: 1000000000,
        mtimeMs: Date.now(),
      } as any);

      const models = await modelLoader.load();

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('model1');
    });

    it('should return empty array when both server and filesystem fail', async () => {
      const mockClient = mockedAxios.create.mock.results[0].value as any;
      mockClient.get.mockRejectedValue(new Error('Connection refused'));

      mockedFs.existsSync.mockReturnValue(false);

      const models = await modelLoader.load();

      expect(models).toEqual([]);
    });
  });
});
