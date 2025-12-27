import { promises as fs } from 'fs';
import * as path from 'path';
import { ModelDiscoveryService, ModelMetadata } from '@/lib/services/ModelDiscoveryService';

jest.mock('fs');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('ModelDiscoveryService', () => {
  let service: ModelDiscoveryService;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
    };

    jest.mock('@/lib/services/../logger', () => ({
      getLogger: () => mockLogger,
    }));

    service = new ModelDiscoveryService('/models');

    mockedPath.resolve.mockImplementation((p: string) => p);
    mockedPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockedPath.basename.mockImplementation((p: string, ext?: string) => {
      if (ext) return p.replace(ext, '');
      return p.split('/').pop() || p;
    });
    mockedPath.extname.mockImplementation((p: string) => {
      const match = p.match(/\.[^.]+$/);
      return match ? match[0] : '';
    });
    mockedPath.format.mockImplementation((p: any) => `${p.dir}/${p.name}${p.ext}`);
    mockedPath.dirname.mockImplementation((p: string) => p.split('/').slice(0, -1).join('/'));
  });

  describe('constructor', () => {
    it('should initialize with base path', () => {
      expect(service).toBeInstanceOf(ModelDiscoveryService);
    });
  });

  describe('discoverModels', () => {
    beforeEach(() => {
      const mockDirent = {
        name: 'model.gguf',
        isDirectory: jest.fn().mockReturnValue(false),
      };
      const mockStat = {
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000000000,
      };

      mockedFs.readdir.mockResolvedValue([mockDirent] as any);
      mockedFs.stat.mockResolvedValue(mockStat as any);
    });

    it('should discover .gguf model files', async () => {
      const mockDirent = {
        name: 'model.gguf',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir.mockResolvedValue([mockDirent] as any);
      mockedFs.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000000000,
      } as any);

      const models = await service.discoverModels('/models');

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('model');
      expect(models[0].path).toContain('model.gguf');
      expect(models[0].size).toBe(1000000000);
      expect(models[0].format).toBe('llama');
      expect(models[0].quantized).toBe(false);
    });

    it('should discover .quant.bin model files', async () => {
      const mockDirent = {
        name: 'model.quant.bin',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir.mockResolvedValue([mockDirent] as any);
      mockedFs.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 500000000,
      } as any);

      const models = await service.discoverModels('/models');

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('model.quant');
      expect(models[0].format).toBe('gguf');
      expect(models[0].quantized).toBe(true);
    });

    it('should discover .bin model files', async () => {
      const mockDirent = {
        name: 'model.bin',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir.mockResolvedValue([mockDirent] as any);
      mockedFs.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 750000000,
      } as any);

      const models = await service.discoverModels('/models');

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('model');
      expect(models[0].format).toBe('llama');
      expect(models[0].quantized).toBe(false);
    });

    it('should recursively scan subdirectories', async () => {
      const subDirDirent = {
        name: 'subdir',
        isDirectory: jest.fn().mockReturnValue(true),
      };
      const modelDirent = {
        name: 'submodel.gguf',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir
        .mockResolvedValueOnce([subDirDirent] as any)
        .mockResolvedValueOnce([modelDirent] as any);

      mockedFs.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 2000000000,
        } as any);

      const models = await service.discoverModels('/models', 2);

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('submodel');
    });

    it('should respect maxDepth parameter', async () => {
      const subDirDirent = {
        name: 'subdir',
        isDirectory: jest.fn().mockReturnValue(true),
      };

      mockedFs.readdir.mockResolvedValue([subDirDirent] as any);
      mockedFs.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(true),
      } as any);

      const models = await service.discoverModels('/models', 0);

      expect(models).toHaveLength(0);
    });

    it('should load metadata from adjacent JSON file', async () => {
      const mockDirent = {
        name: 'model.gguf',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir.mockResolvedValue([mockDirent] as any);
      mockedFs.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000000000,
      } as any);
      mockedFs.readFile.mockResolvedValue(JSON.stringify({ author: 'Test Author', version: '1.0' }));

      const models = await service.discoverModels('/models');

      expect(models[0].author).toBe('Test Author');
      expect(models[0].version).toBe('1.0');
    });

    it('should handle missing or invalid metadata file gracefully', async () => {
      const mockDirent = {
        name: 'model.gguf',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir.mockResolvedValue([mockDirent] as any);
      mockedFs.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000000000,
      } as any);
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));

      const models = await service.discoverModels('/models');

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('model');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should skip files that cannot be stated', async () => {
      const mockDirent = {
        name: 'model.gguf',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir.mockResolvedValue([mockDirent] as any);
      mockedFs.stat.mockRejectedValue(new Error('Permission denied'));

      const models = await service.discoverModels('/models');

      expect(models).toHaveLength(0);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle non-model files', async () => {
      const mockDirent = {
        name: 'readme.txt',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir.mockResolvedValue([mockDirent] as any);
      mockedFs.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000,
      } as any);

      const models = await service.discoverModels('/models');

      expect(models).toHaveLength(0);
    });

    it('should handle directory scan errors', async () => {
      mockedFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const models = await service.discoverModels('/models');

      expect(models).toHaveLength(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle case-insensitive extensions', async () => {
      const mockDirent1 = {
        name: 'MODEL.GGUF',
        isDirectory: jest.fn().mockReturnValue(false),
      };
      const mockDirent2 = {
        name: 'model.BIN',
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFs.readdir.mockResolvedValue([mockDirent1, mockDirent2] as any);
      mockedFs.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 1000000000,
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 2000000000,
        } as any);

      const models = await service.discoverModels('/models');

      expect(models).toHaveLength(2);
    });
  });

  describe('getDefaultParameters', () => {
    it('should return default parameters', () => {
      const params = service.getDefaultParameters();

      expect(params).toEqual({
        temperature: 0.7,
        top_p: 0.9,
        repeat_penalty: 1.1,
        max_tokens: 2048,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
      });
    });
  });

  describe('validateModelConfig', () => {
    it('should validate a valid configuration', () => {
      const config = {
        name: 'Test Model',
        path: '/path/to/model.gguf',
      };

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject configuration without name', () => {
      const config = {
        path: '/path/to/model.gguf',
      };

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model name is required');
    });

    it('should reject configuration without path', () => {
      const config = {
        name: 'Test Model',
      };

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model path is required');
    });

    it('should reject configuration with non-string path', () => {
      const config = {
        name: 'Test Model',
        path: 123,
      };

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model path must be a string');
    });

    it('should return multiple errors for invalid configuration', () => {
      const config = {};

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Model name is required');
      expect(result.errors).toContain('Model path is required');
    });
  });
});
