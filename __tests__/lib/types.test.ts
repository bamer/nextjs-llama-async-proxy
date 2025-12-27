import {
  ModelStatus,
  ModelProcessInfo,
  ModelState,
  ExtendedState
} from '@/lib/types';

describe('types.ts', () => {
  describe('ModelStatus type', () => {
    it('accepts valid status values', () => {
      const statuses: ModelStatus[] = ['idle', 'starting', 'started', 'error'];
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('idle');
      expect(statuses).toContain('starting');
      expect(statuses).toContain('started');
      expect(statuses).toContain('error');
    });

    it('exports ModelStatus type', () => {
      expect(typeof 'idle' as ModelStatus).toBe('string');
    });

    it('rejects invalid status values', () => {
      const invalidStatus = 'invalid';
      const isStatus = (s: string): s is ModelStatus =>
        ['idle', 'starting', 'started', 'error'].includes(s);
      expect(isStatus(invalidStatus)).toBe(false);
    });
  });

  describe('ModelProcessInfo interface', () => {
    it('creates valid ModelProcessInfo object', () => {
      const processInfo: ModelProcessInfo = {
        pid: 12345,
        launchedAt: Date.now(),
        model: 'llama2'
      };
      expect(processInfo.pid).toBe(12345);
      expect(processInfo.launchedAt).toBeGreaterThan(0);
      expect(processInfo.model).toBe('llama2');
    });

    it('requires pid, launchedAt, and model properties', () => {
      const processInfo: ModelProcessInfo = {
        pid: 9999,
        launchedAt: 1234567890,
        model: 'codellama'
      };
      expect(processInfo).toHaveProperty('pid');
      expect(processInfo).toHaveProperty('launchedAt');
      expect(processInfo).toHaveProperty('model');
      expect(typeof processInfo.pid).toBe('number');
      expect(typeof processInfo.launchedAt).toBe('number');
      expect(typeof processInfo.model).toBe('string');
    });

    it('allows different valid pid values', () => {
      const processInfo1: ModelProcessInfo = { pid: 1, launchedAt: Date.now(), model: 'test' };
      const processInfo2: ModelProcessInfo = { pid: 99999, launchedAt: Date.now(), model: 'test' };
      expect(processInfo1.pid).toBe(1);
      expect(processInfo2.pid).toBe(99999);
    });

    it('allows different valid timestamp values', () => {
      const now = Date.now();
      const past = now - 1000000;
      const processInfo: ModelProcessInfo = { pid: 12345, launchedAt: past, model: 'test' };
      expect(processInfo.launchedAt).toBeLessThan(now);
    });

    it('allows different model names', () => {
      const models = ['llama2', 'codellama', 'mistral', 'gemma', 'phi'];
      models.forEach(model => {
        const processInfo: ModelProcessInfo = { pid: 12345, launchedAt: Date.now(), model };
        expect(processInfo.model).toBe(model);
      });
    });
  });

  describe('ModelState interface', () => {
    it('creates valid ModelState with only required status', () => {
      const state: ModelState = {
        status: 'idle'
      };
      expect(state.status).toBe('idle');
    });

    it('creates valid ModelState with all properties', () => {
      const state: ModelState = {
        status: 'started',
        pid: 12345,
        launchedAt: Date.now()
      };
      expect(state.status).toBe('started');
      expect(state.pid).toBe(12345);
      expect(state.launchedAt).toBeGreaterThan(0);
      expect(state.error).toBeUndefined();
    });

    it('allows additional properties via index signature', () => {
      const state: ModelState = {
        status: 'started',
        pid: 12345,
        customField: 'custom value',
        anotherField: 42
      };
      expect((state as any).customField).toBe('custom value');
      expect((state as any).anotherField).toBe(42);
    });

    it('supports all ModelStatus values', () => {
      const states: ModelState[] = [
        { status: 'idle' },
        { status: 'starting' },
        { status: 'started' },
        { status: 'error', error: 'test error' }
      ];
      expect(states).toHaveLength(4);
      states.forEach((state, index) => {
        const expectedStatus = ['idle', 'starting', 'started', 'error'][index] as ModelStatus;
        expect(state.status).toBe(expectedStatus);
      });
    });

    it('includes error property when status is error', () => {
      const state: ModelState = {
        status: 'error',
        error: 'Process failed'
      };
      expect(state.status).toBe('error');
      expect(state.error).toBe('Process failed');
    });
  });

  describe('ExtendedState type', () => {
    it('creates valid ExtendedState as record of ModelStates', () => {
      const state: ExtendedState = {
        'llama2': { status: 'started', pid: 12345 },
        'codellama': { status: 'idle' },
        'mistral': { status: 'error', error: 'Failed to start' }
      };
      expect(state['llama2'].status).toBe('started');
      expect(state['codellama'].status).toBe('idle');
      expect(state['mistral'].status).toBe('error');
    });

    it('allows empty ExtendedState', () => {
      const state: ExtendedState = {};
      expect(Object.keys(state)).toHaveLength(0);
    });

    it('handles multiple model states', () => {
      const state: ExtendedState = {
        model1: { status: 'idle' },
        model2: { status: 'starting' },
        model3: { status: 'started', pid: 11111 },
        model4: { status: 'started', pid: 22222 },
        model5: { status: 'error', error: 'test error' }
      };
      expect(Object.keys(state)).toHaveLength(5);
      expect(state['model1'].status).toBe('idle');
      expect(state['model2'].status).toBe('starting');
      expect(state['model3'].pid).toBe(11111);
      expect(state['model4'].pid).toBe(22222);
      expect(state['model5'].error).toBe('test error');
    });

    it('supports dynamic model names as keys', () => {
      const models = ['llama2', 'codellama:latest', 'mistral:7b', 'custom-model:v1'];
      const state: ExtendedState = {};
      models.forEach(model => {
        state[model] = { status: 'idle' };
      });
      models.forEach(model => {
        expect(state[model]).toBeDefined();
        expect(state[model].status).toBe('idle');
      });
    });

    it('stores complete ModelProcessInfo in ModelState', () => {
      const launchedAt = Date.now();
      const state: ExtendedState = {
        'llama2': {
          status: 'started',
          pid: 12345,
          launchedAt,
          model: 'llama2'
        }
      };
      expect(state['llama2']).toHaveProperty('pid');
      expect(state['llama2']).toHaveProperty('launchedAt');
      expect(state['llama2']).toHaveProperty('model');
      expect(state['llama2'].pid).toBe(12345);
      expect(state['llama2'].launchedAt).toBe(launchedAt);
    });
  });

  describe('type exports', () => {
    it('exports all expected types', () => {
      expect(typeof 'test' as ModelStatus).toBeDefined();
      const modelState: ModelState = { status: 'idle' };
      expect(modelState).toBeDefined();
      const processInfo: ModelProcessInfo = { pid: 12345, launchedAt: Date.now(), model: 'test' };
      expect(processInfo).toBeDefined();
      const extendedState: ExtendedState = {};
      expect(extendedState).toBeDefined();
    });

    it('ModelStatus is a union type', () => {
      const status1: ModelStatus = 'idle';
      const status2: ModelStatus = 'starting';
      const status3: ModelStatus = 'started';
      const status4: ModelStatus = 'error';
      expect(status1).toBeDefined();
      expect(status2).toBeDefined();
      expect(status3).toBeDefined();
      expect(status4).toBeDefined();
    });

    it('ModelState has optional properties', () => {
      const state1: ModelState = { status: 'idle' };
      const state2: ModelState = { status: 'started', pid: 12345 };
      const state3: ModelState = { status: 'started', pid: 12345, launchedAt: Date.now() };
      const state4: ModelState = { status: 'error', error: 'test' };
      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state3).toBeDefined();
      expect(state4).toBeDefined();
    });

    it('ExtendedState is Record type', () => {
      const state: ExtendedState = { test: { status: 'idle' } };
      const keys = Object.keys(state);
      expect(keys).toContain('test');
      expect(typeof state.test).toBe('object');
    });
  });
});
