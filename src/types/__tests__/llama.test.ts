import type { LlamaModel, LlamaStatus, LlamaStatusEvent } from '@/types/llama';
import { llamaConfigScenarios } from './llama-config.scenarios';
import { llamaModelScenarios } from './llama-model.scenarios';
import { llamaStatusBasicScenarios } from './llama-status-basic.scenarios';
import { llamaStatusEdgeScenarios } from './llama-status-edge.scenarios';
import { llamaEventScenarios } from './llama-event.scenarios';

describe('Llama Types', () => {
  // Import scenario test suites
  llamaConfigScenarios();
  llamaModelScenarios();
  llamaStatusBasicScenarios();
  llamaStatusEdgeScenarios();
  llamaEventScenarios();

  describe('Type guards and validation', () => {
    it('validates LlamaModel structure', () => {
      const model: unknown = {
        id: 'llama-2-7b',
        name: 'Llama 2 7B',
        size: 7340166656,
        type: 'llama',
        modified_at: 1699824000000,
        available: true,
      };

      const isValidModel =
        typeof model === 'object' &&
        model !== null &&
        'id' in model &&
        'name' in model &&
        'size' in model &&
        'type' in model &&
        'modified_at' in model &&
        'available' in model;

      expect(isValidModel).toBe(true);
    });

    it('validates LlamaStatus structure', () => {
      const status: unknown = {
        status: 'ready',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 3600,
        startedAt: '2024-01-01T00:00:00.000Z',
      };

      const isValidStatus =
        typeof status === 'object' &&
        status !== null &&
        'status' in status &&
        'models' in status &&
        'lastError' in status &&
        'retries' in status &&
        'uptime' in status &&
        'startedAt' in status;

      expect(isValidStatus).toBe(true);
    });

    it('validates LlamaStatusEvent structure', () => {
      const event: unknown = {
        type: 'llama_status',
        data: {
          status: 'ready',
          models: [],
          lastError: null,
          retries: 0,
          uptime: 0,
          startedAt: null,
        },
        timestamp: Date.now(),
      };

      const isValidEvent =
        typeof event === 'object' &&
        event !== null &&
        'type' in event &&
        'data' in event &&
        'timestamp' in event;

      expect(isValidEvent).toBe(true);
    });
  });
});
