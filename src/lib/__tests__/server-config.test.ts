import {
  loadConfig,
  saveConfig,
  LlamaServerConfig,
} from '@/lib/server-config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

jest.mock('fs');
jest.mock('path');

const mockedReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockedWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>;
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockedJoin = join as jest.MockedFunction<typeof join>;

describe('server-config', () => {
  const mockConfigFile = '/mocked/path/llama-server-config.json';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedJoin.mockReturnValue(mockConfigFile);
    jest.spyOn(process, 'cwd').mockReturnValue('/mocked/path');
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', () => {
      mockedExistsSync.mockReturnValue(false);

      const config = loadConfig();

      expect(config).toEqual({
        host: 'localhost',
        port: 8134,
        basePath: '/models',
        serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      } as LlamaServerConfig);

      expect(mockedExistsSync).toHaveBeenCalledWith(mockConfigFile);
      expect(mockedReadFileSync).not.toHaveBeenCalled();
    });

    it('should load and merge config from file', () => {
      const savedConfig = {
        host: '0.0.0.0',
        port: 9000,
        ctx_size: 4096,
      };

      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify(savedConfig));

      const config = loadConfig();

      expect(config).toEqual({
        host: '0.0.0.0',
        port: 9000,
        basePath: '/models',
        serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
        ctx_size: 4096,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      } as LlamaServerConfig);

      expect(mockedReadFileSync).toHaveBeenCalledWith(mockConfigFile, 'utf8');
    });

    it('should handle invalid JSON in config file', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue('invalid json');

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const config = loadConfig();

      expect(config).toEqual({
        host: 'localhost',
        port: 8134,
        basePath: '/models',
        serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      } as LlamaServerConfig);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load config, using defaults:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle file read errors', () => {
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const config = loadConfig();

      expect(config).toEqual({
        host: 'localhost',
        port: 8134,
        basePath: '/models',
        serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      } as LlamaServerConfig);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load config, using defaults:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should merge partial config with defaults', () => {
      const partialConfig = {
        port: 9999,
        threads: 4,
      };

      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify(partialConfig));

      const config = loadConfig();

      expect(config).toEqual({
        host: 'localhost',
        port: 9999,
        basePath: '/models',
        serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
        ctx_size: 8192,
        batch_size: 512,
        threads: 4,
        gpu_layers: -1,
      } as LlamaServerConfig);
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const partialConfig = {
        port: 9999,
        ctx_size: 16384,
      };

      mockedExistsSync.mockReturnValue(false);

      saveConfig(partialConfig);

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify(
          {
            host: 'localhost',
            port: 9999,
            basePath: '/models',
            serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
            ctx_size: 16384,
            batch_size: 512,
            threads: -1,
            gpu_layers: -1,
          },
          null,
          2
        ),
        'utf8'
      );
    });

    it('should merge with existing config when saving', () => {
      const existingConfig = {
        host: '0.0.0.0',
        port: 9000,
        basePath: '/api',
      };

      const partialUpdate = {
        port: 9999,
        ctx_size: 16384,
      };

      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify(existingConfig));

      saveConfig(partialUpdate);

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify(
          {
            host: '0.0.0.0',
            port: 9999,
            basePath: '/api',
            serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
            ctx_size: 16384,
            batch_size: 512,
            threads: -1,
            gpu_layers: -1,
          },
          null,
          2
        ),
        'utf8'
      );
    });

    it('should throw error on save failure', () => {
      mockedExistsSync.mockReturnValue(false);
      mockedWriteFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => saveConfig({ port: 9999 })).toThrow('Write failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save config:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('config structure', () => {
    it('should have all required config properties', () => {
      mockedExistsSync.mockReturnValue(false);

      const config = loadConfig();

      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('basePath');
      expect(config).toHaveProperty('serverPath');
      expect(config).toHaveProperty('ctx_size');
      expect(config).toHaveProperty('batch_size');
      expect(config).toHaveProperty('threads');
      expect(config).toHaveProperty('gpu_layers');

      expect(typeof config.host).toBe('string');
      expect(typeof config.port).toBe('number');
      expect(typeof config.basePath).toBe('string');
      expect(typeof config.serverPath).toBe('string');
      expect(typeof config.ctx_size).toBe('number');
      expect(typeof config.batch_size).toBe('number');
      expect(typeof config.threads).toBe('number');
      expect(typeof config.gpu_layers).toBe('number');
    });
  });
});
