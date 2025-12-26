import { StateManager } from '@/server/services/llama/stateManager';
import type { LlamaServiceState, LlamaServiceStatus } from '@/server/services/llama/types';

describe('StateManager', () => {
  let stateManager: StateManager;
  const initialState: LlamaServiceState = {
    status: 'initial',
    models: [],
    lastError: null,
    retries: 0,
    uptime: 0,
    startedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    stateManager = new StateManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with initial state', () => {
      const state = stateManager.getState();

      expect(state).toEqual(initialState);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = stateManager.getState();

      expect(state.status).toBe('initial');
      expect(state.models).toEqual([]);
      expect(state.retries).toBe(0);
    });

    it('should return new reference on each call', () => {
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('setStatus', () => {
    it('should update status', () => {
      stateManager.setStatus('ready');

      const state = stateManager.getState();

      expect(state.status).toBe('ready');
    });

    it('should emit state change on status update', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);
      stateManager.setStatus('stopping');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'stopping' })
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status and error message', () => {
      const errorMsg = 'Test error';
      stateManager.updateStatus('error', errorMsg);

      const state = stateManager.getState();

      expect(state.status).toBe('error');
      expect(state.lastError).toBe(errorMsg);
    });

    it('should reset retries when status is ready', () => {
      stateManager.updateStatus('crashed', 'Crash');
      stateManager.updateStatus('ready');

      const state = stateManager.getState();

      expect(state.retries).toBe(0);
    });
  });

  describe('setModels', () => {
    it('should update models array', () => {
      const models = [
        { id: 'model1', name: 'Model 1' },
        { id: 'model2', name: 'Model 2' },
      ];

      stateManager.setModels(models);

      const state = stateManager.getState();

      expect(state.models).toEqual(models);
      expect(state.models.length).toBe(2);
    });

    it('should overwrite existing models', () => {
      const models1 = [{ id: 'model1', name: 'Model 1' }];
      const models2 = [{ id: 'model2', name: 'Model 2' }];

      stateManager.setModels(models1);
      stateManager.setModels(models2);

      const state = stateManager.getState();

      expect(state.models).toEqual(models2);
      expect(state.models.length).toBe(1);
    });
  });

  describe('incrementRetries', () => {
    it('should increment retries counter', () => {
      stateManager.incrementRetries();

      const state = stateManager.getState();

      expect(state.retries).toBe(1);
    });

    it('should increment multiple times', () => {
      stateManager.incrementRetries();
      stateManager.incrementRetries();
      stateManager.incrementRetries();

      const state = stateManager.getState();

      expect(state.retries).toBe(3);
    });
  });

  describe('startUptimeTracking', () => {
    it('should set startedAt timestamp', () => {
      jest.useFakeTimers();
      const now = new Date();
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      stateManager.startUptimeTracking();

      const state = stateManager.getState();

      expect(state.startedAt).toBeInstanceOf(Date);
      expect(state.startedAt?.getTime()).toBe(now.getTime());
      jest.useRealTimers();
    });

    it('should start uptime interval', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      jest.spyOn(Date, 'now').mockReturnValue(1000000);

      stateManager.startUptimeTracking();

      jest.advanceTimersByTime(2000);

      expect(callback).toHaveBeenCalled();
      const state = stateManager.getState();
      expect(state.uptime).toBe(2);
      jest.useRealTimers();
    });
  });

  describe('stopUptimeTracking', () => {
    it('should clear uptime interval', () => {
      jest.useFakeTimers();

      stateManager.startUptimeTracking();
      stateManager.stopUptimeTracking();

      jest.advanceTimersByTime(2000);

      const state = stateManager.getState();
      expect(state.uptime).toBe(0);
      jest.useRealTimers();
    });

    it('should keep startedAt timestamp after stopping', () => {
      const now = new Date();
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      stateManager.startUptimeTracking();
      stateManager.stopUptimeTracking();

      const state = stateManager.getState();
      expect(state.startedAt).toBeInstanceOf(Date);
      jest.useRealTimers();
    });
  });

  describe('onStateChange', () => {
    it('should register state change callback', () => {
      const callback = jest.fn();

      stateManager.onStateChange(callback);

      expect(typeof callback).toBe('function');
    });

    it('should call callback on state change', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);
      stateManager.setStatus('ready');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ready' })
      );
    });

    it('should support multiple callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      stateManager.onStateChange(callback1);
      stateManager.onStateChange(callback2);
      stateManager.setStatus('error', 'Test error');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should handle status → models flow', () => {
      stateManager.setStatus('ready');

      const models = [{ id: 'model1', name: 'Model 1' }];
      stateManager.setModels(models);

      const state = stateManager.getState();

      expect(state.status).toBe('ready');
      expect(state.models).toEqual(models);
    });

    it('should handle error → retry → success flow', () => {
      stateManager.updateStatus('error', 'Initial error');
      stateManager.incrementRetries();
      stateManager.updateStatus('ready');

      const state = stateManager.getState();

      expect(state.lastError).toBe(null);
      expect(state.retries).toBe(0);
      expect(state.status).toBe('ready');
    });

    it('should handle full lifecycle with uptime', () => {
      jest.useFakeTimers();

      stateManager.startUptimeTracking();
      jest.advanceTimersByTime(1000);

      const state = stateManager.getState();
      expect(state.uptime).toBe(1);

      stateManager.stopUptimeTracking();
      jest.useRealTimers();
    });
  });

  describe('type safety', () => {
    it('should enforce correct status types', () => {
      const validStatuses: LlamaServiceStatus[] = [
        'initial',
        'starting',
        'ready',
        'error',
        'crashed',
        'stopping',
      ];

      validStatuses.forEach((status) => {
        stateManager.setStatus(status);
        const state = stateManager.getState();
        expect(state.status).toBe(status);
      });
    });
  });
});
