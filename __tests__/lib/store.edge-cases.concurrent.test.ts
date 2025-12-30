import { useStore } from '@/lib/store';
import { act } from '@testing-library/react';
import { ModelConfig, SystemMetrics, LogEntry } from '@/types/global';

describe('store edge cases - Concurrent Updates and Integration', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useStore.setState({
        models: [],
        activeModelId: null,
        metrics: null,
        logs: [],
        settings: {
          theme: 'system' as const,
          notifications: true,
          autoRefresh: true,
        },
        status: {
          isLoading: false,
          error: null,
          llamaServerStatus: 'unknown',
        },
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
      });
    });
  });

  // Helper function to create a complete ModelConfig
  const createModelConfig = (overrides?: Partial<ModelConfig>): ModelConfig => ({
    id: 'model-1',
    name: 'Test Model',
    type: 'llama',
    parameters: {},
    status: 'idle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  describe('Concurrent state updates', () => {
    it('should handle rapid consecutive setModels calls', () => {
      act(() => {
        for (let i = 0; i < 100; i++) {
          useStore.getState().setModels([createModelConfig({ id: `model-${i}` })]);
        }
      });

      expect(useStore.getState().models[0].id).toBe('model-99');
    });

    it('should handle rapid consecutive addModel calls', () => {
      act(() => {
        for (let i = 0; i < 100; i++) {
          useStore.getState().addModel(createModelConfig({ id: `model-${i}` }));
        }
      });

      expect(useStore.getState().models).toHaveLength(100);
    });

    it('should handle mixed updates', () => {
      const model: ModelConfig = createModelConfig();
      act(() => {
        useStore.getState().addModel(model);
        useStore.getState().setActiveModel(model.id);
        useStore.getState().updateModel(model.id, { status: 'running' });
        useStore.getState().setError('Test error');
        useStore.getState().clearError();
        useStore.getState().setLoading(true);
        useStore.getState().setLoading(false);
      });

      expect(useStore.getState().models[0].status).toBe('running');
      expect(useStore.getState().activeModelId).toBe(model.id);
    });

    it('should handle concurrent updates to different state parts', () => {
      act(() => {
        useStore.getState().addModel(createModelConfig({ id: 'model-1' }));
        useStore.getState().addLog({
          id: 'log-1',
          level: 'info',
          message: 'Test log',
          timestamp: '2024-12-27T00:00:00Z',
        });
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().updateSettings({ theme: 'dark' });
      });

      expect(useStore.getState().models).toHaveLength(1);
      expect(useStore.getState().logs).toHaveLength(1);
      expect(useStore.getState().chartHistory.cpu).toHaveLength(1);
      expect(useStore.getState().settings.theme).toBe('dark');
    });
  });

  describe('Complex integration scenarios', () => {
    it('should handle complete workflow: add, update, activate, deactivate, remove', () => {
      const model: ModelConfig = createModelConfig({ id: 'model-1' });

      act(() => {
        // Add model
        useStore.getState().addModel(model);
        expect(useStore.getState().models).toHaveLength(1);

        // Update model
        useStore.getState().updateModel('model-1', { status: 'running' });
        expect(useStore.getState().models[0].status).toBe('running');

        // Activate model
        useStore.getState().setActiveModel('model-1');
        expect(useStore.getState().activeModelId).toBe('model-1');

        // Deactivate model
        useStore.getState().setActiveModel(null);
        expect(useStore.getState().activeModelId).toBeNull();

        // Remove model
        useStore.getState().removeModel('model-1');
        expect(useStore.getState().models).toHaveLength(0);
      });
    });

    it('should handle logging and metrics update workflow', () => {
        const metrics: SystemMetrics = {
          cpuUsage: 50,
          memoryUsage: 60,
          diskUsage: 70,
          activeModels: 2,
          totalRequests: 100,
          avgResponseTime: 200,
          uptime: 1800,
          timestamp: '2024-12-27T00:00:00Z',
        };

        act(() => {
          useStore.getState().setLoading(true);
          useStore.getState().setMetrics(metrics);
          useStore.getState().addLog({
            id: 'log-1',
            level: 'info',
            message: 'Metrics updated',
            timestamp: '2024-12-27T00:00:00Z',
          });
          useStore.getState().setLoading(false);
        });

        expect(useStore.getState().metrics).toEqual(metrics);
        expect(useStore.getState().logs).toHaveLength(1);
        expect(useStore.getState().status.isLoading).toBe(false);
      });
    });

    it('should handle chart data tracking workflow', () => {
      act(() => {
        for (let i = 0; i < 100; i++) {
          useStore.getState().addChartData('cpu', i);
        }
        useStore.getState().trimChartData(50);
        expect(useStore.getState().chartHistory.cpu).toHaveLength(50);
        useStore.getState().clearChartData();
        expect(useStore.getState().chartHistory.cpu).toHaveLength(0);
      });
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle updating model with empty updates object', () => {
      const model: ModelConfig = createModelConfig();
      act(() => {
        useStore.getState().addModel(model);
        useStore.getState().updateModel(model.id, {});
      });

      expect(useStore.getState().models[0]).toEqual(model);
    });

    it('should handle adding log with minimal properties', () => {
      const log: LogEntry = {
        id: 'log-1',
        level: 'info',
        message: 'Test',
        timestamp: '2024-12-27T00:00:00Z',
      };

      act(() => {
        useStore.getState().addLog(log);
      });

      expect(useStore.getState().logs[0]).toEqual(log);
    });
  });
});
