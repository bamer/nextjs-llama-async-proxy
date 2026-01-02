/**
 * Generators for mock status and model data in tests
 */

import { TestModel } from './llama-status.basic-mocks';

/**
 * Create mock status with large models array
 */
export const createMockStatusWithLargeModels = (count: number = 10000) => {
  const largeModels = Array.from({ length: count }, (_, i) => ({
    id: `model-${i}`,
    name: `Model ${i}`,
  }));

  return {
    status: 'running' as const,
    models: largeModels,
    lastError: null,
    retries: 0,
    uptime: 100,
    startedAt: null,
  };
};

/**
 * Create rapid status updates sequence
 */
export const createRapidStatusUpdates = (count: number = 1000) => {
  return Array.from({ length: count }, (_, i) => ({
    status: 'running' as const,
    models: [{ id: `${i}`, name: `Model ${i}` }],
    lastError: null,
    retries: i % 10,
    uptime: i * 100,
    startedAt: '2024-01-01T00:00:00Z',
  }));
};
