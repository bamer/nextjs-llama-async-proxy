/**
 * Unit tests for config API endpoint
 */
import { GET, POST } from '@/app/api/config/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/server-config', () => ({
  loadConfig: jest.fn(),
  saveConfig: jest.fn(),
}));

const { loadConfig, saveConfig } = require('@/lib/server-config');

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

describe('Config API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadConfig.mockReturnValue(defaultConfig);
  });

  describe('GET /api/config', () => {
    it('should return 200 status with configuration', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(defaultConfig);
    });

    it('should return JSON content type', async () => {
      const response = await GET();

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should return configuration with all required fields', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('host');
      expect(data).toHaveProperty('port');
      expect(data).toHaveProperty('basePath');
      expect(data).toHaveProperty('serverPath');
      expect(data).toHaveProperty('ctx_size');
      expect(data).toHaveProperty('batch_size');
      expect(data).toHaveProperty('threads');
      expect(data).toHaveProperty('gpu_layers');
    });

    it('should handle loadConfig errors', async () => {
      loadConfig.mockImplementation(() => {
        throw new Error('Failed to load config');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to get config' });
    });
  });

  describe('POST /api/config', () => {
    it('should save configuration and return 200', async () => {
      const newConfig = {
        host: "127.0.0.1",
        port: 9000,
      };

      const request = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify(newConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Configuration saved successfully',
        config: newConfig,
      });
      expect(saveConfig).toHaveBeenCalledWith(newConfig);
    });

    it('should merge partial configuration updates', async () => {
      const partialConfig = {
        host: "new-host",
        ctx_size: 16384,
      };

      const request = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify(partialConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      expect(saveConfig).toHaveBeenCalledWith(partialConfig);
    });

    it('should handle saveConfig errors', async () => {
      saveConfig.mockImplementation(() => {
        throw new Error('Failed to save');
      });

      const newConfig = { host: 'test' };
      const request = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify(newConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to save config' });
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: 'invalid json{{{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Configuration saved successfully');
      expect(saveConfig).toHaveBeenCalledWith({});
    });

    it('should accept all valid config fields', async () => {
      const fullConfig = {
        host: "test-host",
        port: 9999,
        basePath: "/test/path",
        serverPath: "/test/server",
        ctx_size: 4096,
        batch_size: 256,
        threads: 4,
        gpu_layers: 35,
      };

      const request = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify(fullConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config).toEqual(fullConfig);
    });
  });

  describe('Integration tests', () => {
    it('should support GET after POST flow', async () => {
      const newConfig = {
        host: "integration-host",
        port: 8888,
      };

      // POST new config
      loadConfig.mockReturnValue({ ...defaultConfig, ...newConfig });
      const postRequest = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify(newConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const postResponse = await POST(postRequest);
      expect(postResponse.status).toBe(200);

      // GET updated config
      loadConfig.mockReturnValue({ ...defaultConfig, ...newConfig });
      const getResponse = await GET();
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.host).toBe('integration-host');
      expect(getData.port).toBe(8888);
    });

    it('should maintain type safety across API calls', async () => {
      const response = await GET();
      const data = await response.json();

      expect(typeof data.host).toBe('string');
      expect(typeof data.port).toBe('number');
      expect(typeof data.basePath).toBe('string');
      expect(typeof data.serverPath).toBe('string');
      expect(typeof data.ctx_size).toBe('number');
      expect(typeof data.batch_size).toBe('number');
      expect(typeof data.threads).toBe('number');
      expect(typeof data.gpu_layers).toBe('number');
    });
  });
});
