import type { LlamaStatus } from '@/types/llama';

const createModel = (
  id: string,
  name: string,
  size: number,
  type: string,
  available: boolean = true,
) => ({
  id,
  name,
  size,
  type,
  modified_at: 1699824000000,
  available,
});

export const llamaStatusBasicScenarios = () => {
  describe('LlamaStatus', () => {
    it('creates valid LlamaStatus - positive test for complete structure', () => {
      const status: LlamaStatus = {
        status: 'ready',
        models: [createModel('llama-2-7b', 'Llama 2 7B', 7340166656, 'llama')],
        lastError: null,
        retries: 0,
        uptime: 3600,
        startedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(status.status).toBe('ready');
      expect(status.models).toHaveLength(1);
      expect(status.lastError).toBeNull();
      expect(status.retries).toBe(0);
      expect(status.uptime).toBe(3600);
    });

    it('handles multiple models', () => {
      const status: LlamaStatus = {
        status: 'ready',
        models: [
          createModel('llama-2-7b', 'Llama 2 7B', 7340166656, 'llama'),
          createModel('mistral-7b', 'Mistral 7B', 4160838656, 'mistral'),
        ],
        lastError: null,
        retries: 0,
        uptime: 7200,
        startedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(status.models).toHaveLength(2);
    });

    it('handles error state with lastError - negative test for error handling', () => {
      const status: LlamaStatus = {
        status: 'error',
        models: [],
        lastError: 'Failed to load model: insufficient memory',
        retries: 3,
        uptime: 0,
        startedAt: null,
      };

      expect(status.status).toBe('error');
      expect(status.lastError).toBe('Failed to load model: insufficient memory');
      expect(status.retries).toBeGreaterThan(0);
    });

    it('handles crashed state', () => {
      const status: LlamaStatus = {
        status: 'crashed',
        models: [],
        lastError: 'Process terminated unexpectedly',
        retries: 0,
        uptime: 120,
        startedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(status.status).toBe('crashed');
      expect(status.lastError).not.toBeNull();
    });

    it('handles initial state with no models', () => {
      const status: LlamaStatus = {
        status: 'initial',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      };

      expect(status.status).toBe('initial');
      expect(status.models).toHaveLength(0);
      expect(status.startedAt).toBeNull();
    });

    it('handles starting state', () => {
      const status: LlamaStatus = {
        status: 'starting',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      };

      expect(status.status).toBe('starting');
    });

    it('handles stopping state', () => {
      const status: LlamaStatus = {
        status: 'stopping',
        models: [createModel('llama-2-7b', 'Llama 2 7B', 7340166656, 'llama', false)],
        lastError: null,
        retries: 0,
        uptime: 3600,
        startedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(status.status).toBe('stopping');
    });

    it('validates uptime is non-negative number', () => {
      const status: LlamaStatus = {
        status: 'ready',
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('validates retries is non-negative integer', () => {
      const status: LlamaStatus = {
        status: 'error',
        models: [],
        lastError: 'Test error',
        retries: 5,
        uptime: 0,
        startedAt: null,
      };

      expect(status.retries).toBeGreaterThanOrEqual(0);
    });
  });
};
