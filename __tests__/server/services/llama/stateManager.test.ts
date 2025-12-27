import { StateManager } from '@/server/services/llama/stateManager';
import { LlamaServiceState, LlamaServiceStatus, LlamaModel } from '@/server/services/llama/types';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    stateManager = new StateManager();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default state', () => {
      const state = stateManager.getState();

      expect(state.status).toBe('initial');
      expect(state.models).toEqual([]);
      expect(state.lastError).toBeNull();
      expect(state.retries).toBe(0);
      expect(state.uptime).toBe(0);
      expect(state.startedAt).toBeNull();
    });
  });

  describe('getState', () => {
    it('should return a copy of the state', () => {
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });

    it('should not reflect changes after copy', () => {
      const stateCopy = stateManager.getState();

      stateManager.updateStatus('starting');

      expect(stateCopy.status).toBe('initial');
      expect(stateManager.getState().status).toBe('starting');
    });
  });

  describe('updateStatus', () => {
    it('should update status', () => {
      stateManager.updateStatus('starting');
      expect(stateManager.getState().status).toBe('starting');

      stateManager.updateStatus('ready');
      expect(stateManager.getState().status).toBe('ready');
    });

    it('should update lastError when provided', () => {
      stateManager.updateStatus('error', 'Test error');
      const state = stateManager.getState();

      expect(state.status).toBe('error');
      expect(state.lastError).toBe('Test error');
    });

    it('should not update lastError when not provided', () => {
      stateManager.updateStatus('error', 'Test error');
      stateManager.updateStatus('starting');

      expect(stateManager.getState().lastError).toBe('Test error');
    });

    it('should reset retries when status is ready', () => {
      stateManager.incrementRetries();
      stateManager.incrementRetries();
      expect(stateManager.getState().retries).toBe(2);

      stateManager.updateStatus('ready');

      expect(stateManager.getState().retries).toBe(0);
    });

    it('should not reset retries for other statuses', () => {
      stateManager.incrementRetries();
      expect(stateManager.getState().retries).toBe(1);

      stateManager.updateStatus('starting');

      expect(stateManager.getState().retries).toBe(1);
    });

    it('should emit state change on update', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      stateManager.updateStatus('starting');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'starting' })
      );
    });
  });

  describe('setModels', () => {
    it('should set models', () => {
      const models: LlamaModel[] = [
        {
          id: 'model1',
          name: 'Model 1',
          size: 1000000000,
          type: 'gguf',
          modified_at: Date.now() / 1000,
        },
        {
          id: 'model2',
          name: 'Model 2',
          size: 2000000000,
          type: 'bin',
          modified_at: Date.now() / 1000,
        },
      ];

      stateManager.setModels(models);

      expect(stateManager.getState().models).toEqual(models);
    });

    it('should set empty models', () => {
      stateManager.setModels([]);

      expect(stateManager.getState().models).toEqual([]);
    });

    it('should emit state change on setModels', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      const models: LlamaModel[] = [
        {
          id: 'model1',
          name: 'Model 1',
          size: 1000000000,
          type: 'gguf',
          modified_at: Date.now() / 1000,
        },
      ];

      stateManager.setModels(models);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          models: expect.arrayContaining([
            expect.objectContaining({ id: 'model1' }),
          ]),
        })
      );
    });
  });

  describe('incrementRetries', () => {
    it('should increment retries', () => {
      stateManager.incrementRetries();
      expect(stateManager.getState().retries).toBe(1);

      stateManager.incrementRetries();
      expect(stateManager.getState().retries).toBe(2);

      stateManager.incrementRetries();
      expect(stateManager.getState().retries).toBe(3);
    });

    it('should emit state change on increment', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      stateManager.incrementRetries();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ retries: 1 })
      );
    });
  });

  describe('resetRetries', () => {
    it('should reset retries to zero', () => {
      stateManager.incrementRetries();
      stateManager.incrementRetries();
      expect(stateManager.getState().retries).toBe(2);

      stateManager.resetRetries();

      expect(stateManager.getState().retries).toBe(0);
    });

    it('should emit state change on reset', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      stateManager.resetRetries();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ retries: 0 })
      );
    });
  });

  describe('startUptimeTracking', () => {
    it('should set startedAt timestamp', () => {
      stateManager.startUptimeTracking();

      const startedAt = stateManager.getState().startedAt;
      expect(startedAt).toBeInstanceOf(Date);
      expect(startedAt).not.toBeNull();
    });

    it('should clear existing interval before starting new one', () => {
      stateManager.startUptimeTracking();
      const interval1 = (stateManager as any).uptimeInterval;

      stateManager.startUptimeTracking();
      const interval2 = (stateManager as any).uptimeInterval;

      expect(interval1).not.toBe(interval2);
    });

    it('should increment uptime over time', () => {
      stateManager.startUptimeTracking();

      expect(stateManager.getState().uptime).toBe(0);

      jest.advanceTimersByTime(1000);
      expect(stateManager.getState().uptime).toBe(1);

      jest.advanceTimersByTime(2000);
      expect(stateManager.getState().uptime).toBe(3);

      jest.advanceTimersByTime(5000);
      expect(stateManager.getState().uptime).toBe(8);
    });

    it('should emit state changes during uptime tracking', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      stateManager.startUptimeTracking();

      jest.advanceTimersByTime(1000);

      expect(callback).toHaveBeenCalled();
      const lastCallState = callback.mock.calls[callback.mock.calls.length - 1][0] as LlamaServiceState;
      expect(lastCallState.uptime).toBe(1);
    });

    it('should restart uptime tracking if called again', () => {
      stateManager.startUptimeTracking();
      jest.advanceTimersByTime(5000);
      expect(stateManager.getState().uptime).toBe(5);

      stateManager.startUptimeTracking();

      expect(stateManager.getState().uptime).toBe(0);
    });
  });

  describe('stopUptimeTracking', () => {
    it('should clear uptime interval', () => {
      stateManager.startUptimeTracking();
      expect((stateManager as any).uptimeInterval).not.toBeNull();

      stateManager.stopUptimeTracking();

      expect((stateManager as any).uptimeInterval).toBeNull();
    });

    it('should stop uptime increment', () => {
      stateManager.startUptimeTracking();
      jest.advanceTimersByTime(3000);

      stateManager.stopUptimeTracking();

      const uptimeBefore = stateManager.getState().uptime;
      jest.advanceTimersByTime(5000);

      expect(stateManager.getState().uptime).toBe(uptimeBefore);
    });

    it('should handle stop when no interval is running', () => {
      expect(() => {
        stateManager.stopUptimeTracking();
      }).not.toThrow();
    });
  });

  describe('onStateChange', () => {
    it('should register state change callback', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      stateManager.updateStatus('starting');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'starting' })
      );
    });

    it('should support multiple callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      stateManager.onStateChange(callback1);
      stateManager.onStateChange(callback2);
      stateManager.onStateChange(callback3);

      stateManager.updateStatus('ready');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const successCallback = jest.fn();

      stateManager.onStateChange(errorCallback);
      stateManager.onStateChange(successCallback);

      expect(() => {
        stateManager.updateStatus('starting');
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
    });

    it('should call callback with state snapshot', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      stateManager.updateStatus('ready', 'No error');
      stateManager.setModels([
        {
          id: 'model1',
          name: 'Model 1',
          size: 1000000000,
          type: 'gguf',
          modified_at: Date.now() / 1000,
        },
      ]);

      expect(callback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'ready',
          lastError: 'No error',
          models: expect.arrayContaining([
            expect.objectContaining({ id: 'model1' }),
          ]),
        })
      );
    });

    it('should not remove callbacks after emission', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      stateManager.updateStatus('starting');
      stateManager.updateStatus('ready');
      stateManager.updateStatus('error', 'Test error');

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('integration tests', () => {
    it('should manage full lifecycle', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      stateManager.updateStatus('starting');
      stateManager.startUptimeTracking();

      jest.advanceTimersByTime(2000);
      expect(stateManager.getState().uptime).toBe(2);

      stateManager.updateStatus('ready');
      expect(stateManager.getState().retries).toBe(0);

      stateManager.setModels([
        {
          id: 'model1',
          name: 'Model 1',
          size: 1000000000,
          type: 'gguf',
          modified_at: Date.now() / 1000,
        },
      ]);

      stateManager.stopUptimeTracking();

      expect(callback).toHaveBeenCalled();
    });

    it('should handle retry cycle', () => {
      stateManager.updateStatus('starting');

      for (let i = 0; i < 3; i++) {
        stateManager.incrementRetries();
        expect(stateManager.getState().retries).toBe(i + 1);
        stateManager.updateStatus('crashed', `Attempt ${i + 1} failed`);
      }

      stateManager.updateStatus('ready');

      expect(stateManager.getState().retries).toBe(0);
      expect(stateManager.getState().lastError).toBe('Attempt 3 failed');
    });
  });
});
