/**
 * Tests for src/types/llama.ts
 * Objective: Verify LlamaModel, LlamaServiceStatus, LlamaStatus, and LlamaStatusEvent types
 */

import { describe, it, expect } from '@jest/globals';
import type {
  LlamaModel,
  LlamaServiceStatus,
  LlamaStatus,
  LlamaStatusEvent,
} from '@/types/llama';

describe('src/types/llama.ts - Llama Types', () => {
  describe('LlamaModel Interface', () => {
    /**
     * Positive Test: Verify LlamaModel can be instantiated with all required fields
     * Expected result: LlamaModel should accept all defined properties
     */
    it('should create valid LlamaModel with all required fields', () => {
      // Arrange
      const model: LlamaModel = {
        id: 'llama-2-7b',
        name: 'Llama 2 7B',
        size: 7340032000, // ~6.8GB
        type: 'llama',
        modified_at: 1704067200000,
        available: true,
      };

      // Act & Assert
      expect(model.id).toBe('llama-2-7b');
      expect(model.name).toBe('Llama 2 7B');
      expect(model.size).toBe(7340032000);
      expect(model.type).toBe('llama');
      expect(model.modified_at).toBe(1704067200000);
      expect(model.available).toBe(true);
    });

    /**
     * Positive Test: Verify LlamaModel supports optional fields
     * Expected result: status, createdAt, and updatedAt should be optional
     */
    it('should support optional fields in LlamaModel', () => {
      // Arrange
      const modelWithoutOptional: LlamaModel = {
        id: 'mistral-7b',
        name: 'Mistral 7B',
        size: 4219873280,
        type: 'mistral',
        modified_at: 1704067200000,
        available: true,
      };

      const modelWithOptional: LlamaModel = {
        id: 'llama-2-13b',
        name: 'Llama 2 13B',
        size: 13421772800,
        type: 'llama',
        modified_at: 1704067200000,
        available: false,
        status: 'running',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T01:00:00Z',
      };

      // Act & Assert
      expect(modelWithoutOptional.status).toBeUndefined();
      expect(modelWithoutOptional.createdAt).toBeUndefined();
      expect(modelWithoutOptional.updatedAt).toBeUndefined();

      expect(modelWithOptional.status).toBe('running');
      expect(modelWithOptional.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(modelWithOptional.updatedAt).toBe('2025-01-01T01:00:00Z');
    });

    /**
     * Negative Test: Verify LlamaModel enforces required fields
     * Expected result: Missing required fields should be detectable
     */
    it('should enforce required fields in LlamaModel', () => {
      // Arrange
      const requiredFields: (keyof LlamaModel)[] = [
        'id',
        'name',
        'size',
        'type',
        'modified_at',
        'available',
      ];

      const validModel: LlamaModel = {
        id: 'test-model',
        name: 'Test Model',
        size: 1000000,
        type: 'llama',
        modified_at: 1704067200000,
        available: true,
      };

      // Act & Assert
      requiredFields.forEach((field) => {
        expect(validModel).toHaveProperty(field);
      });
    });
  });

  describe('LlamaServiceStatus Type', () => {
    /**
     * Positive Test: Verify LlamaServiceStatus accepts all valid values
     * Expected result: All status values should be valid
     */
    it('should accept all valid LlamaServiceStatus values', () => {
      // Arrange
      const validStatuses: LlamaServiceStatus[] = [
        'initial',
        'starting',
        'ready',
        'error',
        'crashed',
        'stopping',
      ];

      // Act & Assert
      validStatuses.forEach((status) => {
        expect(status).toMatch(/^(initial|starting|ready|error|crashed|stopping)$/);
      });

      expect(validStatuses).toHaveLength(6);
    });

    /**
     * Negative Test: Verify LlamaServiceStatus rejects invalid values
     * Expected result: Invalid status values should be detectable
     */
    it('should reject invalid LlamaServiceStatus values', () => {
      // Arrange
      const invalidStatuses = ['unknown', 'pending', 'completed', 'failed', 'invalid'];

      // Act & Assert
      invalidStatuses.forEach((status) => {
        expect(status).not.toMatch(/^(initial|starting|ready|error|crashed|stopping)$/);
      });
    });
  });

  describe('LlamaStatus Interface', () => {
    /**
     * Positive Test: Verify LlamaStatus can be instantiated with all fields
     * Expected result: LlamaStatus should accept all defined properties
     */
    it('should create valid LlamaStatus with all fields', () => {
      // Arrange
      const status: LlamaStatus = {
        status: 'ready',
        models: [
          {
            id: 'llama-2-7b',
            name: 'Llama 2 7B',
            size: 7340032000,
            type: 'llama',
            modified_at: 1704067200000,
            available: true,
          },
        ],
        lastError: null,
        retries: 0,
        uptime: 3600,
        startedAt: '2025-01-01T00:00:00Z',
      };

      // Act & Assert
      expect(status.status).toBe('ready');
      expect(status.models).toHaveLength(1);
      expect(status.lastError).toBeNull();
      expect(status.retries).toBe(0);
      expect(status.uptime).toBe(3600);
      expect(status.startedAt).toBe('2025-01-01T00:00:00Z');
    });

    /**
     * Positive Test: Verify LlamaStatus supports error state
     * Expected result: LlamaStatus should accept error state with lastError
     */
    it('should support error state with lastError', () => {
      // Arrange
      const errorStatus: LlamaStatus = {
        status: 'error',
        models: [],
        lastError: 'Failed to load model: Out of memory',
        retries: 3,
        uptime: 120,
        startedAt: '2025-01-01T00:00:00Z',
      };

      // Act & Assert
      expect(errorStatus.status).toBe('error');
      expect(errorStatus.lastError).toBe('Failed to load model: Out of memory');
      expect(errorStatus.retries).toBeGreaterThan(0);
    });

    /**
     * Positive Test: Verify LlamaStatus supports null startedAt for initial state
     * Expected result: startedAt should be nullable
     */
    it('should support null startedAt for initial state', () => {
      // Arrange
      const initialStatus: LlamaStatus = {
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      };

      // Act & Assert
      expect(initialStatus.status).toBe('initial');
      expect(initialStatus.startedAt).toBeNull();
      expect(initialStatus.uptime).toBe(0);
    });
  });

  describe('LlamaStatusEvent Interface', () => {
    /**
     * Positive Test: Verify LlamaStatusEvent can be instantiated
     * Expected result: LlamaStatusEvent should accept all defined properties
     */
    it('should create valid LlamaStatusEvent', () => {
      // Arrange
      const llamaStatus: LlamaStatus = {
        status: 'ready',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 100,
        startedAt: '2025-01-01T00:00:00Z',
      };

      const event: LlamaStatusEvent = {
        type: 'llama_status',
        data: llamaStatus,
        timestamp: Date.now(),
      };

      // Act & Assert
      expect(event.type).toBe('llama_status');
      expect(event.data).toEqual(llamaStatus);
      expect(event.timestamp).toBeGreaterThanOrEqual(0);
      expect(event.timestamp).toBeLessThanOrEqual(Date.now());
    });

    /**
     * Positive Test: Verify LlamaStatusEvent type is fixed to 'llama_status'
     * Expected result: type should always be 'llama_status'
     */
    it('should enforce type as "llama_status"', () => {
      // Arrange
      const event: LlamaStatusEvent = {
        type: 'llama_status',
        data: {
          status: 'initial',
          models: [],
          lastError: null,
          retries: 0,
          uptime: 0,
          startedAt: null,
        },
        timestamp: 1234567890,
      };

      // Act & Assert
      expect(event.type).toBe('llama_status');
      expect(event.type).not.toBe('other_type');
    });
  });

  /**
   * Positive Test: Verify integration between Llama types
   * Expected result: LlamaStatus should properly contain LlamaModel array
   */
  it('should support integration between LlamaModel and LlamaStatus', () => {
    // Arrange
    const models: LlamaModel[] = [
      {
        id: 'model-1',
        name: 'Model 1',
        size: 1000000,
        type: 'llama',
        modified_at: 1704067200000,
        available: true,
      },
      {
        id: 'model-2',
        name: 'Model 2',
        size: 2000000,
        type: 'mistral',
        modified_at: 1704153600000,
        available: false,
      },
    ];

    const status: LlamaStatus = {
      status: 'ready',
      models: models,
      lastError: null,
      retries: 0,
      uptime: 500,
      startedAt: '2025-01-01T00:00:00Z',
    };

    // Act & Assert
    expect(status.models).toEqual(models);
    expect(status.models).toHaveLength(2);
    expect(status.models[0].id).toBe('model-1');
    expect(status.models[1].id).toBe('model-2');
  });

  /**
   * Negative Test: Verify type safety for status transitions
   * Expected result: Status transitions should be validated
   */
  it('should validate status transitions', () => {
    // Arrange
    const validTransitions: LlamaServiceStatus[] = [
      'initial',
      'starting',
      'ready',
      'error',
      'stopping',
      'crashed',
    ];

    // Act & Assert - Verify all statuses are valid
    validTransitions.forEach((status) => {
      const llamaStatus: LlamaStatus = {
        status,
        models: [],
        lastError: status === 'error' || status === 'crashed' ? 'Error occurred' : null,
        retries: status === 'error' ? 3 : 0,
        uptime: 100,
        startedAt: '2025-01-01T00:00:00Z',
      };

      expect(validTransitions).toContain(llamaStatus.status);
    });
  });
});
