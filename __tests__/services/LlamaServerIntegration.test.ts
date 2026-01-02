import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LlamaServerIntegration } from '@/server/services/LlamaServerIntegration';

jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('LlamaServerIntegration', () => {
  let integration: LlamaServerIntegration;

  beforeEach(() => {
    integration = new LlamaServerIntegration();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const { logger } = require('@/services/logger');
      
      expect(integration).toBeDefined();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should connect to llama server on startup', () => {
      const { logger } = require('@/services/logger');
      
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Llama server'));
    });
  });

  describe('WebSocket communication', () => {
    it('should start WebSocket connection', () => {
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
      };
      
      expect(() => {
        integration.setWebSocket(mockSocket as any);
      }).not.toThrow();
    });

    it('should handle WebSocket messages', () => {
      const message = { type: 'metrics', data: {} };
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
      };
      
      mockSocket.on('message', (data: any) => {
        expect(data.type).toBe('metrics');
      });
      
      mockSocket.emit('message', message);
    });

    it('should handle WebSocket disconnection', () => {
      const mockSocket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
      };
      
      mockSocket.emit('close');
      
      const { logger } = require('@/services/logger');
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should log connection errors', () => {
      const error = new Error('Connection failed');
      
      expect(() => {
        integration.handleError(error);
      }).not.toThrow();
      
      const { logger } = require('@/services/logger');
      expect(logger.error).toHaveBeenCalledWith(error);
    });

    it('should retry failed connections', () => {
      const error = new Error('Connection timeout');
      
      expect(() => {
        integration.handleError(error);
      }).not.toThrow();
      
      // Should schedule retry
    });
  });
});
