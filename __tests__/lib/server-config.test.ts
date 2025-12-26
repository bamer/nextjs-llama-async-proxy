import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { loadConfig, saveConfig } from '@/lib/server-config';

jest.mock('fs');
jest.mock('path');

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockJoin = join as jest.MockedFunction<typeof join>;


describe('server-config', () => {
  const mockConfigPath = '/mock/path/llama-server-config.json';
  const defaultConfig = {
    host: "localhost",
    port: 8134,
    basePath: "/models",
    serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
    ctx_size: 8192,
    batch_size: 512,
    threads: -1,
    gpu_layers: -1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockJoin.mockReturnValue(mockConfigPath);
    process.cwd = jest.fn().mockReturnValue('/mock/path');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadConfig', () => {
    it('should return default config when config file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const config = loadConfig();

      expect(config).toEqual(defaultConfig);
      expect(mockExistsSync).toHaveBeenCalledWith(mockConfigPath);
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });

    it('should load and merge config from file when it exists', () => {
      const savedConfig = {
        host: "192.168.1.100",
        port: 9000,
        basePath: "/custom/models",
      };
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(savedConfig));

      const config = loadConfig();

      expect(config).toEqual({
        ...defaultConfig,
        ...savedConfig,
      });
      expect(mockExistsSync).toHaveBeenCalledWith(mockConfigPath);
      expect(mockReadFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });

    it('should handle malformed JSON in config file', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json{{{');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const config = loadConfig();

      expect(config).toEqual(defaultConfig);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load config, using defaults:',
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
    });

    it('should handle file system errors gracefully', () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('File system error');
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const config = loadConfig();

      expect(config).toEqual(defaultConfig);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load config, using defaults:',
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
    });

    it('should handle partial config updates', () => {
      const partialConfig = {
        host: "custom-host",
        ctx_size: 16384,
      };
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(partialConfig));

      const config = loadConfig();

      expect(config.host).toBe("custom-host");
      expect(config.ctx_size).toBe(16384);
      expect(config.port).toBe(defaultConfig.port);
      expect(config.basePath).toBe(defaultConfig.basePath);
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const newConfig = {
        host: "127.0.0.1",
        port: 8080,
      };
      mockExistsSync.mockReturnValue(false);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      saveConfig(newConfig);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify({ ...defaultConfig, ...newConfig }, null, 2)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Configuration saved to:',
        mockConfigPath
      );
      consoleLogSpy.mockRestore();
    });

    it('should merge new config with existing config', () => {
      const existingConfig = {
        host: "existing-host",
        port: 9000,
      };
      const update = {
        port: 9999,
        basePath: "/new/path",
      };
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingConfig));

      saveConfig(update);

      const expectedConfig = {
        ...defaultConfig,
        ...existingConfig,
        ...update,
      };
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(expectedConfig, null, 2)
      );
    });

    it('should throw error when write fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => saveConfig({ host: 'test' })).toThrow('Write failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save config:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Config integration', () => {
    it('should support save and load cycle', () => {
      const testConfig = {
        host: "test-host",
        port: 1234,
        basePath: "/test/path",
        serverPath: "/test/server",
        ctx_size: 4096,
        batch_size: 256,
        threads: 4,
        gpu_layers: 35,
      };

      mockExistsSync.mockReturnValue(false);
      saveConfig(testConfig);

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testConfig));

      const loadedConfig = loadConfig();

      expect(loadedConfig).toEqual(testConfig);
    });

    it('should maintain type safety with TypeScript interface', () => {
      mockExistsSync.mockReturnValue(false);

      const config = loadConfig();

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
