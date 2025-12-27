import { useStore, selectModels, selectActiveModel, selectMetrics, selectLogs, selectSettings, selectStatus, selectChartHistory } from '@/lib/store';
import { act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
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

  describe('models state', () => {
    it('should set models', () => {
      const mockModels = [
        { id: '1', name: 'Model 1' },
        { id: '2', name: 'Model 2' },
      ] as any;

      act(() => {
        useStore.getState().setModels(mockModels);
      });

      expect(useStore.getState().models).toEqual(mockModels);
    });

    it('should add a model', () => {
      const mockModel = { id: '1', name: 'New Model' } as any;

      act(() => {
        useStore.getState().addModel(mockModel);
      });

      expect(useStore.getState().models).toHaveLength(1);
      expect(useStore.getState().models[0]).toEqual(mockModel);
    });

    it('should update a model', () => {
      const mockModels = [
        { id: '1', name: 'Model 1' },
        { id: '2', name: 'Model 2' },
      ] as any;

      act(() => {
        useStore.getState().setModels(mockModels);
        useStore.getState().updateModel('1', { name: 'Updated Model 1' });
      });

      expect(useStore.getState().models[0].name).toBe('Updated Model 1');
      expect(useStore.getState().models[1].name).toBe('Model 2');
    });

    it('should remove a model', () => {
      const mockModels = [
        { id: '1', name: 'Model 1' },
        { id: '2', name: 'Model 2' },
      ] as any;

      act(() => {
        useStore.getState().setModels(mockModels);
        useStore.getState().setActiveModel('1');
        useStore.getState().removeModel('1');
      });

      expect(useStore.getState().models).toHaveLength(1);
      expect(useStore.getState().models[0].id).toBe('2');
      expect(useStore.getState().activeModelId).toBeNull();
    });
  });

  describe('active model', () => {
    it('should set active model', () => {
      act(() => {
        useStore.getState().setActiveModel('model-123');
      });

      expect(useStore.getState().activeModelId).toBe('model-123');
    });

    it('should clear active model when set to null', () => {
      act(() => {
        useStore.getState().setActiveModel('model-123');
        useStore.getState().setActiveModel(null);
      });

      expect(useStore.getState().activeModelId).toBeNull();
    });
  });

  describe('metrics', () => {
    it('should set metrics', () => {
      const mockMetrics = {
        cpu: 50,
        memory: 60,
        requests: 100,
      } as any;

      act(() => {
        useStore.getState().setMetrics(mockMetrics);
      });

      expect(useStore.getState().metrics).toEqual(mockMetrics);
    });
  });

  describe('logs', () => {
    it('should add a log', () => {
      const mockLog = {
        id: 'log-1',
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info' as const,
        message: 'Test log message',
      };

      act(() => {
        useStore.getState().addLog(mockLog);
      });

      expect(useStore.getState().logs).toHaveLength(1);
      expect(useStore.getState().logs[0]).toEqual(mockLog);
    });

    it('should limit logs to 100 entries', () => {
      const logs = Array.from({ length: 150 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info' as const,
        message: `Log message ${i}`,
      }));

      act(() => {
        logs.forEach((log) => useStore.getState().addLog(log));
      });

      expect(useStore.getState().logs).toHaveLength(100);
    });

    it('should set logs', () => {
      const mockLogs = [
        { id: 'log-1', timestamp: '2024-01-01T00:00:00Z', level: 'info' as const, message: 'Log 1' },
        { id: 'log-2', timestamp: '2024-01-01T00:01:00Z', level: 'error' as const, message: 'Log 2' },
      ];

      act(() => {
        useStore.getState().setLogs(mockLogs);
      });

      expect(useStore.getState().logs).toEqual(mockLogs);
    });

    it('should clear logs', () => {
      const mockLogs = [
        { id: 'log-1', timestamp: '2024-01-01T00:00:00Z', level: 'info' as const, message: 'Log 1' },
      ];

      act(() => {
        useStore.getState().setLogs(mockLogs);
        useStore.getState().clearLogs();
      });

      expect(useStore.getState().logs).toHaveLength(0);
    });
  });

  describe('settings', () => {
    it('should update settings', () => {
      act(() => {
        useStore.getState().updateSettings({ theme: 'dark' as const });
      });

      expect(useStore.getState().settings.theme).toBe('dark');
      expect(useStore.getState().settings.notifications).toBe(true);
      expect(useStore.getState().settings.autoRefresh).toBe(true);
    });

    it('should update multiple settings at once', () => {
      act(() => {
        useStore.getState().updateSettings({
          theme: 'dark' as const,
          notifications: false,
          autoRefresh: false,
        });
      });

      expect(useStore.getState().settings.theme).toBe('dark');
      expect(useStore.getState().settings.notifications).toBe(false);
      expect(useStore.getState().settings.autoRefresh).toBe(false);
    });
  });

  describe('status', () => {
    it('should set loading status', () => {
      act(() => {
        useStore.getState().setLoading(true);
      });

      expect(useStore.getState().status.isLoading).toBe(true);
      expect(useStore.getState().status.error).toBeNull();
    });

    it('should set error status', () => {
      act(() => {
        useStore.getState().setError('Test error');
      });

      expect(useStore.getState().status.error).toBe('Test error');
      expect(useStore.getState().status.isLoading).toBe(false);
    });

    it('should clear error', () => {
      act(() => {
        useStore.getState().setError('Test error');
        useStore.getState().clearError();
      });

      expect(useStore.getState().status.error).toBeNull();
    });
  });

  describe('chart data', () => {
    it('should add chart data point', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
      });

      const cpuData = useStore.getState().chartHistory.cpu;
      expect(cpuData).toHaveLength(1);
      expect(cpuData[0].value).toBe(50);
      expect(cpuData[0].time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(cpuData[0].displayTime).toMatch(/^\d{2}:\d{2}:\d{2}/);
    });

    it('should limit chart data to 60 points', () => {
      act(() => {
        for (let i = 0; i < 70; i++) {
          useStore.getState().addChartData('cpu', i);
        }
      });

      const cpuData = useStore.getState().chartHistory.cpu;
      expect(cpuData).toHaveLength(60);
      expect(cpuData[0].value).toBe(10); // First 10 should be removed
      expect(cpuData[59].value).toBe(69);
    });

    it('should trim chart data to max points', () => {
      act(() => {
        for (let i = 0; i < 100; i++) {
          useStore.getState().addChartData('memory', i);
        }
        useStore.getState().trimChartData(30);
      });

      const memoryData = useStore.getState().chartHistory.memory;
      expect(memoryData).toHaveLength(30);
    });

    it('should clear all chart data', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().addChartData('memory', 60);
        useStore.getState().addChartData('requests', 100);
        useStore.getState().clearChartData();
      });

      expect(useStore.getState().chartHistory.cpu).toHaveLength(0);
      expect(useStore.getState().chartHistory.memory).toHaveLength(0);
      expect(useStore.getState().chartHistory.requests).toHaveLength(0);
      expect(useStore.getState().chartHistory.gpuUtil).toHaveLength(0);
      expect(useStore.getState().chartHistory.power).toHaveLength(0);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      act(() => {
        useStore.getState().setModels([
          { id: '1', name: 'Model 1' },
          { id: '2', name: 'Model 2' },
        ] as any);
        useStore.getState().setActiveModel('1');
        useStore.getState().setMetrics({ cpu: 50, memory: 60 } as any);
        useStore.getState().addLog({
          id: 'log-1',
          timestamp: '2024-01-01T00:00:00Z',
          level: 'info',
          message: 'Test log',
        });
      });
    });

    it('selectModels should return models', () => {
      const models = selectModels(useStore.getState());
      expect(models).toHaveLength(2);
    });

    it('selectActiveModel should return active model', () => {
      const activeModel = selectActiveModel(useStore.getState());
      expect(activeModel).toEqual({ id: '1', name: 'Model 1' });
    });

    it('selectActiveModel should return null when no active model', () => {
      act(() => {
        useStore.getState().setActiveModel(null);
      });

      const activeModel = selectActiveModel(useStore.getState());
      expect(activeModel).toBeNull();
    });

    it('selectMetrics should return metrics', () => {
      const metrics = selectMetrics(useStore.getState());
      expect(metrics).toEqual({ cpu: 50, memory: 60 });
    });

    it('selectLogs should return logs', () => {
      const logs = selectLogs(useStore.getState());
      expect(logs).toHaveLength(1);
    });

    it('selectSettings should return settings', () => {
      const settings = selectSettings(useStore.getState());
      expect(settings).toHaveProperty('theme');
      expect(settings).toHaveProperty('notifications');
      expect(settings).toHaveProperty('autoRefresh');
    });

    it('selectStatus should return status', () => {
      const status = selectStatus(useStore.getState());
      expect(status).toHaveProperty('isLoading');
      expect(status).toHaveProperty('error');
    });

    it('selectChartHistory should return chart history', () => {
      const chartHistory = selectChartHistory(useStore.getState());
      expect(chartHistory).toHaveProperty('cpu');
      expect(chartHistory).toHaveProperty('memory');
      expect(chartHistory).toHaveProperty('requests');
      expect(chartHistory).toHaveProperty('gpuUtil');
      expect(chartHistory).toHaveProperty('power');
    });
  });

  describe('persistence', () => {
    it('should persist state to localStorage', () => {
      act(() => {
        useStore.getState().setModels([{ id: '1', name: 'Model 1' }] as any);
        useStore.getState().setActiveModel('1');
        useStore.getState().updateSettings({ theme: 'dark' as const });
      });

      const storedData = localStorage.getItem('llama-app-storage-v2');
      expect(storedData).toBeTruthy();

      const parsed = JSON.parse(storedData!);
      expect(parsed.state).toHaveProperty('models');
      expect(parsed.state).toHaveProperty('activeModelId');
      expect(parsed.state).toHaveProperty('settings');
      expect(parsed.state).toHaveProperty('chartHistory');
    });

    it('should not persist metrics and logs', () => {
      act(() => {
        useStore.getState().setMetrics({ cpu: 50, memory: 60 } as any);
        useStore.getState().addLog({
          id: 'log-1',
          timestamp: '2024-01-01T00:00:00Z',
          level: 'info',
          message: 'Test log',
        });
      });

      const storedData = localStorage.getItem('llama-app-storage-v2');
      const parsed = JSON.parse(storedData!);
      expect(parsed.state).not.toHaveProperty('metrics');
      expect(parsed.state).not.toHaveProperty('logs');
    });
  });
});
