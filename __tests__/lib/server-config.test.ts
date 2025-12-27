import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, saveConfig } from '@/lib/server-config';

jest.mock('fs');
jest.mock('path');

describe('server-config', () => {
  const mockConfigPath = '/test/path/llama-server-config.json';
  const DEFAULT_CONFIG = {
    host: 'localhost',
    port: 8134,
    basePath: '/models',
    serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
    ctx_size: 8192,
    batch_size: 512,
    threads: -1,
    gpu_layers: -1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockReturnValue(mockConfigPath);
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const config = loadConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should load and merge config from file', () => {
      const savedConfig = {
        host: '0.0.0.0',
        port: 9000,
      };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(savedConfig)
      );

      const config = loadConfig();

      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        ...savedConfig,
      });
    });

    it('should handle empty config file', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');

      const config = loadConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should handle partial config file', () => {
      const partialConfig = {
        port: 9000,
        ctx_size: 16384,
      };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(partialConfig)
      );

      const config = loadConfig();

      expect(config.host).toBe(DEFAULT_CONFIG.host);
      expect(config.port).toBe(9000);
      expect(config.ctx_size).toBe(16384);
      expect(config.threads).toBe(DEFAULT_CONFIG.threads);
    });

    it('should handle JSON parse errors', () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json{{{');

      const config = loadConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load config, using defaults:',
        expect.any(SyntaxError)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle file read errors', () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Read error');
      });

      const config = loadConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should preserve all default config properties', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');

      const config = loadConfig();

      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('basePath');
      expect(config).toHaveProperty('serverPath');
      expect(config).toHaveProperty('ctx_size');
      expect(config).toHaveProperty('batch_size');
      expect(config).toHaveProperty('threads');
      expect(config).toHaveProperty('gpu_layers');
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');

      const newConfig = { port: 9000 };
      saveConfig(newConfig);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('"port": 9000'),
        'utf8'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Configuration saved to:',
        mockConfigPath
      );

      consoleLogSpy.mockRestore();
    });

    it('should merge new config with existing config', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ port: 8000, host: 'localhost' })
      );

      saveConfig({ port: 9000 });

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0][0];
      const writtenConfig = JSON.parse(writeCall);

      expect(writtenConfig.port).toBe(9000);
      expect(writtenConfig.host).toBe('localhost');

      consoleLogSpy.mockRestore();
    });

    it('should handle empty update', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');

      saveConfig({});

      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle partial config update', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ port: 8000, ctx_size: 8192 })
      );

      saveConfig({ port: 9000 });

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0][0];
      const writtenConfig = JSON.parse(writeCall);

      expect(writtenConfig.port).toBe(9000);
      expect(writtenConfig.ctx_size).toBe(8192);
      expect(writtenConfig).toHaveProperty('threads');
    });

    it('should throw error on write failure', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => saveConfig({ port: 9000 })).toThrow('Write failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save config:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should write formatted JSON', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');

      saveConfig({ port: 9000 });

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0][0];
      expect(writeCall).toContain('\n');
      expect(writeCall).toContain('  ');
    });

    it('should handle new config file (no existing file)', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      saveConfig({ host: '0.0.0.0' });

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('config properties', () => {
    it('should support all config properties', () => {
      const fullConfig = {
        host: '0.0.0.0',
        port: 9000,
        basePath: '/api',
        serverPath: '/custom/path/llama-server',
        ctx_size: 16384,
        batch_size: 1024,
        threads: 8,
        gpu_layers: 35,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(fullConfig)
      );

      const config = loadConfig();

      expect(config.host).toBe('0.0.0.0');
      expect(config.port).toBe(9000);
      expect(config.basePath).toBe('/api');
      expect(config.serverPath).toBe('/custom/path/llama-server');
      expect(config.ctx_size).toBe(16384);
      expect(config.batch_size).toBe(1024);
      expect(config.threads).toBe(8);
      expect(config.gpu_layers).toBe(35);
    });

    it('should handle negative values for threads and gpu_layers', () => {
      const configWithNegatives = {
        threads: -1,
        gpu_layers: -1,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(configWithNegatives)
      );

      const config = loadConfig();

      expect(config.threads).toBe(-1);
      expect(config.gpu_layers).toBe(-1);
    });
  });
});
