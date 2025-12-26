import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/logger/route';

jest.mock('@/lib/logger', () => ({
  updateLoggerConfig: jest.fn(),
  getLoggerConfig: jest.fn().mockReturnValue({
    consoleLevel: 'info',
    fileLevel: 'info',
    errorLevel: 'error',
    maxFileSize: '20m',
    maxFiles: '30d',
    enableFileLogging: true,
    enableConsoleLogging: true,
  }),
}));

const mockUpdateLoggerConfig = jest.requireMock('@/lib/logger').updateLoggerConfig;
const mockGetLoggerConfig = jest.requireMock('@/lib/logger').getLoggerConfig;

describe('Logger API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET', () => {
    it('should return current logger config', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        consoleLevel: 'info',
        fileLevel: 'info',
        errorLevel: 'error',
        maxFileSize: '20m',
        maxFiles: '30d',
        enableFileLogging: true,
        enableConsoleLogging: true,
      });
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should handle get config errors', async () => {
      mockGetLoggerConfig.mockImplementation(() => {
        throw new Error('Failed to get config');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to get logger config',
      });
    });

    it('should return JSON content type', async () => {
      const response = await GET();

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('POST', () => {
    it('should update logger config', async () => {
      const newConfig = {
        consoleLevel: 'debug',
        fileLevel: 'warn',
        maxFileSize: '50m',
      };

      const request = new NextRequest('http://localhost/api/logger/config', {
        method: 'POST',
        body: JSON.stringify(newConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        message: 'Logger configuration updated',
        config: newConfig,
      });
      expect(mockUpdateLoggerConfig).toHaveBeenCalledWith(newConfig);
    });

    it('should merge partial config with existing', async () => {
      const partialConfig = {
        consoleLevel: 'debug',
        enableFileLogging: false,
      };

      const request = new NextRequest('http://localhost/api/logger/config', {
        method: 'POST',
        body: JSON.stringify(partialConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(mockUpdateLoggerConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          consoleLevel: 'debug',
          fileLevel: 'info',
          errorLevel: 'error',
          maxFileSize: '20m',
          maxFiles: '30d',
          enableFileLogging: false,
          enableConsoleLogging: true,
        })
      );
    });

    it('should handle invalid log level', async () => {
      const invalidConfig = {
        consoleLevel: 'invalid' as any,
      };

      const request = new NextRequest('http://localhost/api/logger/config', {
        method: 'POST',
        body: JSON.stringify(invalidConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUpdateLoggerConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          consoleLevel: 'invalid',
        })
      );
    });

    it('should handle update errors gracefully', async () => {
      mockUpdateLoggerConfig.mockImplementation(() => {
        throw new Error('Update failed');
      });

      const newConfig = {
        consoleLevel: 'debug',
      };

      const request = new NextRequest('http://localhost/api/logger/config', {
        method: 'POST',
        body: JSON.stringify(newConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();

      expect(data).toEqual({
        error: 'Failed to update logger configuration',
      });
    });

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost/api/logger/config', {
        method: 'POST',
        body: 'invalid json{{{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include timestamp in success response', async () => {
      const newConfig = {
        consoleLevel: 'debug',
      };

      const request = new NextRequest('http://localhost/api/logger/config', {
        method: 'POST',
        body: JSON.stringify(newConfig),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('timestamp');
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('validation', () => {
    it('should validate console level', async () => {
      const validLevels = ['error', 'warn', 'info', 'debug'];

      for (const level of validLevels) {
        const request = new NextRequest('http://localhost/api/logger/config', {
          method: 'POST',
          body: JSON.stringify({ consoleLevel: level }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
      }
    });

    it('should validate file size format', async () => {
      const validFormats = ['20m', '50m', '100m', '1g'];

      for (const size of validFormats) {
        const request = new NextRequest('http://localhost/api/logger/config', {
          method: 'POST',
          body: JSON.stringify({ maxFileSize: size }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
      }
    });

    it('should validate boolean values', async () => {
      const request = new NextRequest('http://localhost/api/logger/config', {
        method: 'POST',
        body: JSON.stringify({
          enableFileLogging: true,
          enableConsoleLogging: false,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('integration', () => {
    it('should support get → update flow', async () => {
      const getConfigResponse = await GET();
      const initialConfig = await getConfigResponse.json();

      expect(initialConfig.consoleLevel).toBe('info');

      const updateRequest = new NextRequest('http://localhost/api/logger/config', {
        method: 'POST',
        body: JSON.stringify({ consoleLevel: 'debug' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const updateResponse = await POST(updateRequest);
      const updatedConfig = await updateResponse.json();

      expect(updatedConfig.consoleLevel).toBe('debug');
    });
  });
});
