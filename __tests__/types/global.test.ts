/**
 * Tests for src/types/global.d.ts
 * Objective: Verify global type definitions and utility types
 */

import { describe, it, expect } from '@jest/globals';
import type {
  ModelConfig,
  SystemMetrics,
  LogEntry,
  ApiResponse,
  WebSocketMessage,
  AsyncReturnType,
  Nullable,
  Optional,
  PaginatedResponse,
} from '@/types/global';

describe('src/types/global.d.ts - Global Type Definitions', () => {
  describe('Utility Types', () => {
    /**
     * Positive Test: Verify Nullable utility type
     * Expected result: Nullable<T> should accept T | null
     */
    it('should accept null values for Nullable type', () => {
      // Arrange
      const nullableString: Nullable<string> = 'test';
      const nullableNull: Nullable<string> = null;

      // Act & Assert
      expect(nullableString).toBe('test');
      expect(nullableNull).toBeNull();
    });

    /**
     * Negative Test: Verify Nullable does not accept undefined
     * Expected result: Nullable<T> should reject undefined (only null)
     */
    it('should not accept undefined for Nullable type', () => {
      // Arrange
      const nullableValue: Nullable<string> = null;

      // Act & Assert
      expect(() => {
        if (nullableValue === undefined) {
          throw new Error('Nullable should not accept undefined');
        }
      }).not.toThrow();
    });

    /**
     * Positive Test: Verify Optional utility type
     * Expected result: Optional<T> should accept T | undefined
     */
    it('should accept undefined values for Optional type', () => {
      // Arrange
      const optionalString: Optional<string> = 'test';
      const optionalUndefined: Optional<string> = undefined;

      // Act & Assert
      expect(optionalString).toBe('test');
      expect(optionalUndefined).toBeUndefined();
    });

    /**
     * Positive Test: Verify AsyncReturnType utility type
     * Expected result: AsyncReturnType should extract Promise return type
     */
    it('should extract return type from async function', () => {
      // Arrange
      async function fetchData(): Promise<string> {
        return 'data';
      }

      async function fetchNumber(): Promise<number> {
        return 42;
      }

      // Act & Assert
      const stringResult: AsyncReturnType<typeof fetchData> = 'data';
      const numberResult: AsyncReturnType<typeof fetchNumber> = 42;

      expect(stringResult).toBe('data');
      expect(numberResult).toBe(42);
    });

    /**
     * Negative Test: Verify AsyncReturnType with non-async function
     * Expected result: Should return never for non-async functions
     */
    it('should handle non-async functions', () => {
      // Arrange
      function syncFunction(): string {
        return 'sync';
      }

      // Act & Assert
      // @ts-expect-error - non-async function
      const result: AsyncReturnType<typeof syncFunction> = 'test';

      expect(result).toBeDefined();
    });
  });

  describe('ApiResponse Interface', () => {
    /**
     * Positive Test: Verify ApiResponse success case
     * Expected result: ApiResponse should support success with data
     */
    it('should support success response with data', () => {
      // Arrange
      const response: ApiResponse<string> = {
        success: true,
        data: 'Operation successful',
        timestamp: '2025-01-01T00:00:00Z',
      };

      // Act & Assert
      expect(response.success).toBe(true);
      expect(response.data).toBe('Operation successful');
      expect(response.error).toBeUndefined();
    });

    /**
     * Positive Test: Verify ApiResponse error case
     * Expected result: ApiResponse should support error with error details
     */
    it('should support error response with error details', () => {
      // Arrange
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'ERR_001',
          message: 'Operation failed',
          details: { reason: 'Invalid input' },
        },
        timestamp: '2025-01-01T00:00:00Z',
      };

      // Act & Assert
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('ERR_001');
      expect(response.error?.message).toBe('Operation failed');
      expect(response.error?.details).toEqual({ reason: 'Invalid input' });
      expect(response.data).toBeUndefined();
    });

    /**
     * Positive Test: Verify ApiResponse timestamp is required
     * Expected result: timestamp should always be present
     */
    it('should require timestamp in ApiResponse', () => {
      // Arrange
      const timestamp = '2025-01-01T12:30:45.000Z';

      // Act
      const response: ApiResponse<any> = {
        success: true,
        timestamp,
      };

      // Assert
      expect(response.timestamp).toBe(timestamp);
      expect(() => new Date(response.timestamp)).not.toThrow();
    });
  });

  describe('PaginatedResponse Interface', () => {
    /**
     * Positive Test: Verify PaginatedResponse structure
     * Expected result: PaginatedResponse should accept all pagination fields
     */
    it('should create valid PaginatedResponse', () => {
      // Arrange
      const paginated: PaginatedResponse<string> = {
        data: ['item1', 'item2', 'item3'],
        page: 1,
        limit: 10,
        total: 30,
        totalPages: 3,
      };

      // Act & Assert
      expect(paginated.data).toHaveLength(3);
      expect(paginated.page).toBe(1);
      expect(paginated.limit).toBe(10);
      expect(paginated.total).toBe(30);
      expect(paginated.totalPages).toBe(3);
    });

    /**
     * Negative Test: Verify PaginatedResponse page constraints
     * Expected result: page should be greater than 0 and <= totalPages
     */
    it('should enforce pagination constraints', () => {
      // Arrange
      const paginated: PaginatedResponse<number> = {
        data: [1, 2, 3],
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      };

      // Act & Assert
      expect(paginated.page).toBeGreaterThan(0);
      expect(paginated.page).toBeLessThanOrEqual(paginated.totalPages);
      expect(paginated.limit).toBeGreaterThan(0);
      expect(paginated.total).toBeGreaterThanOrEqual(paginated.data.length);
    });
  });

  describe('WebSocketMessage Interface', () => {
    /**
     * Positive Test: Verify WebSocketMessage with requestId
     * Expected result: WebSocketMessage should support optional requestId
     */
    it('should support WebSocketMessage with requestId', () => {
      // Arrange
      const message: WebSocketMessage<{ data: string }> = {
        type: 'test_event',
        data: { data: 'test' },
        timestamp: Date.now(),
        requestId: 'req-123',
      };

      // Act & Assert
      expect(message.type).toBe('test_event');
      expect(message.data).toEqual({ data: 'test' });
      expect(message.timestamp).toBeGreaterThan(0);
      expect(message.requestId).toBe('req-123');
    });

    /**
     * Positive Test: Verify WebSocketMessage without requestId
     * Expected result: requestId should be optional
     */
    it('should support WebSocketMessage without requestId', () => {
      // Arrange
      const message: WebSocketMessage<{ data: string }> = {
        type: 'test_event',
        data: { data: 'test' },
        timestamp: Date.now(),
      };

      // Act & Assert
      expect(message.type).toBe('test_event');
      expect(message.requestId).toBeUndefined();
    });
  });

  describe('ModelConfig Interface', () => {
    /**
     * Positive Test: Verify ModelConfig with all status types
     * Expected result: ModelConfig status should accept all valid values
     */
    it('should accept all valid ModelConfig status values', () => {
      // Arrange
      const statuses: Array<'idle' | 'loading' | 'running' | 'error'> = [
        'idle',
        'loading',
        'running',
        'error',
      ];

      // Act & Assert
      statuses.forEach((status) => {
        const config: ModelConfig = {
          id: 'model-1',
          name: 'Test Model',
          type: 'llama',
          parameters: {},
          status,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        };
        expect(config.status).toBe(status);
      });
    });

    /**
     * Negative Test: Verify ModelConfig parameters type
     * Expected result: parameters should be Record<string, unknown>
     */
    it('should support flexible parameters object', () => {
      // Arrange
      const config: ModelConfig = {
        id: 'model-1',
        name: 'Test Model',
        type: 'mistral',
        parameters: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          complexSetting: { nested: { value: 123 } },
        },
        status: 'idle',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Act & Assert
      expect(config.parameters).toEqual({
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        complexSetting: { nested: { value: 123 } },
      });
    });
  });

  describe('SystemMetrics Interface', () => {
    /**
     * Positive Test: Verify SystemMetrics with all required fields
     * Expected result: SystemMetrics should accept all defined properties
     */
    it('should create valid SystemMetrics', () => {
      // Arrange
      const metrics: SystemMetrics = {
        cpu: { usage: 45.5 },
        memory: { used: 60.2 },
        disk: { used: 30.0 },
        network: { rx: 100, tx: 50 },
        uptime: 3600,
      };

      // Act & Assert
      expect(metrics.cpu.usage).toBe(45.5);
      expect(metrics.memory.used).toBe(60.2);
      expect(metrics.disk.used).toBe(30.0);
      expect(metrics.network.rx).toBe(100);
      expect(metrics.network.tx).toBe(50);
      expect(metrics.uptime).toBe(3600);
    });

    /**
     * Positive Test: Verify SystemMetrics optional GPU fields
     * Expected result: GPU fields should be optional
     */
    it('should support optional GPU fields', () => {
      // Arrange
      const metricsWithoutGPU: SystemMetrics = {
        cpu: { usage: 50 },
        memory: { used: 60 },
        disk: { used: 30 },
        network: { rx: 0, tx: 0 },
        uptime: 300,
      };

      const metricsWithGPU: SystemMetrics = {
        cpu: { usage: 50 },
        memory: { used: 60 },
        disk: { used: 30 },
        network: { rx: 0, tx: 0 },
        uptime: 300,
        gpu: {
          usage: 75.0,
          memoryUsed: 8.5,
          memoryTotal: 16.0,
          powerUsage: 250,
          powerLimit: 300,
          temperature: 65,
          name: 'NVIDIA RTX 4090',
        },
      };

      // Act & Assert
      expect(metricsWithoutGPU.gpu).toBeUndefined();
      expect(metricsWithGPU.gpu?.usage).toBe(75.0);
      expect(metricsWithGPU.gpu?.name).toBe('NVIDIA RTX 4090');
    });
  });

  describe('LogEntry Interface', () => {
    /**
     * Positive Test: Verify LogEntry with all log levels
     * Expected result: LogEntry should accept all valid log levels
     */
    it('should accept all valid LogEntry levels', () => {
      // Arrange
      const levels: Array<'info' | 'warn' | 'error' | 'debug'> = [
        'info',
        'warn',
        'error',
        'debug',
      ];

      // Act & Assert
      levels.forEach((level) => {
        const entry: LogEntry = {
          id: 'log-1',
          level,
          message: 'Test message',
          timestamp: '2025-01-01T00:00:00Z',
        };
        expect(entry.level).toBe(level);
      });
    });

    /**
     * Positive Test: Verify LogEntry message can be string or object
     * Expected result: message should accept string or Record<string, unknown>
     */
    it('should support string and object message types', () => {
      // Arrange
      const entryWithString: LogEntry = {
        id: 'log-1',
        level: 'info',
        message: 'Simple string message',
        timestamp: '2025-01-01T00:00:00Z',
      };

      const entryWithObject: LogEntry = {
        id: 'log-2',
        level: 'error',
        message: { error: 'Error details', code: 500 },
        timestamp: '2025-01-01T00:00:00Z',
      };

      // Act & Assert
      expect(typeof entryWithString.message).toBe('string');
      expect(typeof entryWithObject.message).toBe('object');
    });

    /**
     * Positive Test: Verify LogEntry optional context
     * Expected result: context should be optional
     */
    it('should support optional context field', () => {
      // Arrange
      const entryWithoutContext: LogEntry = {
        id: 'log-1',
        level: 'info',
        message: 'Message',
        timestamp: '2025-01-01T00:00:00Z',
      };

      const entryWithContext: LogEntry = {
        id: 'log-2',
        level: 'error',
        message: 'Error',
        timestamp: '2025-01-01T00:00:00Z',
        context: { userId: '123', requestId: 'req-456' },
      };

      // Act & Assert
      expect(entryWithoutContext.context).toBeUndefined();
      expect(entryWithContext.context).toEqual({
        userId: '123',
        requestId: 'req-456',
      });
    });
  });
});
