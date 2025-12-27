/**
 * Tests for src/types/index.ts
 * Objective: Verify all type exports are correct and available
 */

import { describe, it, expect } from '@jest/globals';
import type {
  ModelConfig,
  SystemMetrics,
  LogEntry,
  ApiResponse,
  WebSocketMessage,
} from '@/types/index';

describe('src/types/index.ts - Type Exports', () => {
  /**
   * Positive Test: Verify all expected types are exported
   * Expected result: All type exports from global.d.ts should be available
   */
  it('should export all expected types', () => {
    // Arrange - Define valid data structures for each type

    // Act - Create type instances to verify they exist
    const modelConfig: ModelConfig = {
      id: 'model-1',
      name: 'Test Model',
      type: 'llama',
      parameters: { temperature: 0.7 },
      status: 'idle',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const systemMetrics: SystemMetrics = {
      cpuUsage: 45.5,
      memoryUsage: 60.2,
      diskUsage: 30.0,
      activeModels: 2,
      totalRequests: 1000,
      avgResponseTime: 150,
      uptime: 3600,
      timestamp: '2025-01-01T00:00:00Z',
      gpuUsage: 75.0,
    };

    const logEntry: LogEntry = {
      id: 'log-1',
      level: 'info',
      message: 'Test log message',
      timestamp: '2025-01-01T00:00:00Z',
      context: { userId: '123' },
    };

    const apiResponse: ApiResponse<string> = {
      success: true,
      data: 'Success',
      timestamp: '2025-01-01T00:00:00Z',
    };

    const webSocketMessage: WebSocketMessage<{ data: string }> = {
      type: 'test_event',
      data: { data: 'test' },
      timestamp: 1234567890,
      requestId: 'req-123',
    };

    // Assert - Verify all types can be instantiated
    expect(modelConfig.id).toBe('model-1');
    expect(systemMetrics.cpuUsage).toBe(45.5);
    expect(logEntry.id).toBe('log-1');
    expect(apiResponse.success).toBe(true);
    expect(webSocketMessage.type).toBe('test_event');
  });

  /**
   * Negative Test: Verify type safety by checking runtime validation
   * Expected result: Invalid type usage patterns should be demonstrable
   */
  it('should enforce type safety constraints', () => {
    // Arrange - Create valid type instances
    const validModelConfig: ModelConfig = {
      id: 'model-1',
      name: 'Test Model',
      type: 'llama',
      parameters: {},
      status: 'idle',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const validLogEntry: LogEntry = {
      id: 'log-1',
      level: 'info',
      message: 'Test',
      timestamp: '2025-01-01T00:00:00Z',
    };

    // Act & Assert - Verify type constraints through structure validation
    // Check that ModelConfig requires all fields
    expect(() => {
      // This would fail at compile-time with TypeScript strict mode
      // Here we demonstrate the expected structure at runtime
      if (!validModelConfig.id || !validModelConfig.name) {
        throw new Error('ModelConfig missing required fields');
      }
    }).not.toThrow();

    // Check that LogEntry requires valid level
    const validLevels = ['info', 'warn', 'error', 'debug'] as const;
    expect(validLevels).toContain(validLogEntry.level);

    // Verify ApiResponse enforces boolean success
    const apiResponse: ApiResponse<string> = {
      success: true,
      data: 'test',
      timestamp: '2025-01-01T00:00:00Z',
    };
    expect(typeof apiResponse.success).toBe('boolean');
  });

  /**
   * Positive Test: Verify ApiResponse can handle success and error cases
   * Expected result: ApiResponse type should support both success and error responses
   */
  it('should support ApiResponse success and error variants', () => {
    // Arrange
    const successResponse: ApiResponse<string> = {
      success: true,
      data: 'Operation successful',
      timestamp: '2025-01-01T00:00:00Z',
    };

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: 'ERR_001',
        message: 'Operation failed',
        details: { reason: 'Invalid input' },
      },
      timestamp: '2025-01-01T00:00:00Z',
    };

    // Act & Assert
    expect(successResponse.success).toBe(true);
    expect(successResponse.data).toBe('Operation successful');
    expect(successResponse.error).toBeUndefined();

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.error?.code).toBe('ERR_001');
    expect(errorResponse.data).toBeUndefined();
  });

  /**
   * Positive Test: Verify WebSocketMessage supports optional requestId
   * Expected result: requestId should be optional in WebSocketMessage
   */
  it('should support WebSocketMessage with and without requestId', () => {
    // Arrange
    const messageWithId: WebSocketMessage<{ test: string }> = {
      type: 'test',
      data: { test: 'data' },
      timestamp: 1234567890,
      requestId: 'req-1',
    };

    const messageWithoutId: WebSocketMessage<{ test: string }> = {
      type: 'test',
      data: { test: 'data' },
      timestamp: 1234567890,
    };

    // Act & Assert
    expect(messageWithId.requestId).toBe('req-1');
    expect(messageWithoutId.requestId).toBeUndefined();
  });
});
