import { useStore } from '@/lib/store';

const mockStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
});

jest.mock('@/config/app.config', () => ({
  APP_CONFIG: {
    theme: {
      default: 'light',
    },
    api: {
      baseUrl: '/api',
      timeout: 10000,
    },
  },
}));

describe('useStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    useStore.getState().clearLogs();
    useStore.getState().clearChartData();
  });

  describe('initial state', () => {
    it('should have empty initial models', () => {
      const state = useStore.getState();
      expect(state.models).toEqual([]);
    });

    it('should have null activeModelId', () => {
      const state = useStore.getState();
      expect(state.activeModelId).toBeNull();
    });

    it('should have null metrics', () => {
      const state = useStore.getState();
      expect(state.metrics).toBeNull();
    });

    it('should have empty logs', () => {
      const state = useStore.getState();
      expect(state.logs).toEqual([]);
    });

    it('should have initial settings', () => {
      const state = useStore.getState();
      expect(state.settings).toEqual({
        theme: 'light',
        notifications: true,
        autoRefresh: true,
      });
    });

    it('should have empty chart history', () => {
      const state = useStore.getState();
      expect(state.chartHistory).toEqual({
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      });
    });

    it('should have initial status', () => {
      const state = useStore.getState();
      expect(state.status).toEqual({
        isLoading: false,
        error: null,
      });
    });
  });

  describe('setModels', () => {
    it('should set models', () => {
      const models = [
        { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' },
      ];
      useStore.getState().setModels(models);
      expect(useStore.getState().models).toEqual(models);
    });

    it('should replace existing models', () => {
      const models1 = [
        { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' },
      ];
      const models2 = [
        { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' },
      ];
      useStore.getState().setModels(models1);
      useStore.getState().setModels(models2);
      expect(useStore.getState().models).toEqual(models2);
    });
  });

  describe('addModel', () => {
    it('should add a model', () => {
      const model = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model);
      expect(useStore.getState().models).toContainEqual(model);
    });

    it('should add model to existing list', () => {
      const model1 = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      const model2 = { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model1);
      useStore.getState().addModel(model2);
      expect(useStore.getState().models).toHaveLength(2);
    });
  });

  describe('updateModel', () => {
    it('should update a model', () => {
      const model = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model);
      useStore.getState().updateModel('1', { name: 'Updated Model' });
      expect(useStore.getState().models[0].name).toBe('Updated Model');
    });

    it('should not affect other models', () => {
      const model1 = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      const model2 = { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model1);
      useStore.getState().addModel(model2);
      useStore.getState().updateModel('1', { name: 'Updated Model 1' });
      expect(useStore.getState().models[1].name).toBe('Model 2');
    });

    it('should update status correctly', () => {
      const model = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model);
      useStore.getState().updateModel('1', { status: 'running' });
      expect(useStore.getState().models[0].status).toBe('running');
    });
  });

  describe('removeModel', () => {
    it('should remove a model', () => {
      const model = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model);
      useStore.getState().removeModel('1');
      expect(useStore.getState().models).toEqual([]);
    });

    it('should set activeModelId to null when removing active model', () => {
      const model = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model);
      useStore.getState().setActiveModel('1');
      useStore.getState().removeModel('1');
      expect(useStore.getState().activeModelId).toBeNull();
    });

    it('should not affect activeModelId when removing non-active model', () => {
      const model1 = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      const model2 = { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model1);
      useStore.getState().addModel(model2);
      useStore.getState().setActiveModel('1');
      useStore.getState().removeModel('2');
      expect(useStore.getState().activeModelId).toBe('1');
    });
  });

  describe('setActiveModel', () => {
    it('should set active model', () => {
      useStore.getState().setActiveModel('1');
      expect(useStore.getState().activeModelId).toBe('1');
    });

    it('should set active model to null', () => {
      useStore.getState().setActiveModel('1');
      useStore.getState().setActiveModel(null);
      expect(useStore.getState().activeModelId).toBeNull();
    });
  });

  describe('setMetrics', () => {
    it('should set metrics', () => {
      const metrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 2,
        totalRequests: 100,
        avgResponseTime: 100,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };
      useStore.getState().setMetrics(metrics);
      expect(useStore.getState().metrics).toEqual(metrics);
    });

    it('should replace existing metrics', () => {
      const metrics1 = { cpuUsage: 50, memoryUsage: 60, diskUsage: 70, activeModels: 2, totalRequests: 100, avgResponseTime: 100, uptime: 3600, timestamp: new Date().toISOString() };
      const metrics2 = { cpuUsage: 75, memoryUsage: 80, diskUsage: 90, activeModels: 3, totalRequests: 200, avgResponseTime: 200, uptime: 7200, timestamp: new Date().toISOString() };
      useStore.getState().setMetrics(metrics1);
      useStore.getState().setMetrics(metrics2);
      expect(useStore.getState().metrics).toEqual(metrics2);
    });
  });

  describe('addLog', () => {
    it('should add a log', () => {
      const log = { id: '1', level: 'info' as const, message: 'Test log', timestamp: new Date().toISOString() };
      useStore.getState().addLog(log);
      expect(useStore.getState().logs).toContainEqual(log);
    });

    it('should add log to beginning of array', () => {
      const log1 = { id: '1', level: 'info' as const, message: 'Log 1', timestamp: new Date().toISOString() };
      const log2 = { id: '2', level: 'info' as const, message: 'Log 2', timestamp: new Date().toISOString() };
      useStore.getState().addLog(log1);
      useStore.getState().addLog(log2);
      expect(useStore.getState().logs[0]).toEqual(log2);
    });

    it('should limit logs to 100 entries', () => {
      for (let i = 0; i < 105; i++) {
        const log = { id: i.toString(), level: 'info' as const, message: `Log ${i}`, timestamp: new Date().toISOString() };
        useStore.getState().addLog(log);
      }
      expect(useStore.getState().logs).toHaveLength(100);
    });

    it('should keep most recent 100 logs', () => {
      const logs = [];
      for (let i = 0; i < 105; i++) {
        const log = { id: i.toString(), level: 'info' as const, message: `Log ${i}`, timestamp: new Date().toISOString() };
        logs.push(log);
        useStore.getState().addLog(log);
      }
      expect(useStore.getState().logs[0].id).toBe('104');
      expect(useStore.getState().logs[99].id).toBe('5');
    });
  });

  describe('setLogs', () => {
    it('should set logs', () => {
      const logs = [
        { id: '1', level: 'info' as const, message: 'Log 1', timestamp: new Date().toISOString() },
        { id: '2', level: 'error' as const, message: 'Log 2', timestamp: new Date().toISOString() },
      ];
      useStore.getState().setLogs(logs);
      expect(useStore.getState().logs).toEqual(logs);
    });

    it('should replace existing logs', () => {
      const logs1 = [{ id: '1', level: 'info' as const, message: 'Log 1', timestamp: new Date().toISOString() }];
      const logs2 = [{ id: '2', level: 'error' as const, message: 'Log 2', timestamp: new Date().toISOString() }];
      useStore.getState().setLogs(logs1);
      useStore.getState().setLogs(logs2);
      expect(useStore.getState().logs).toEqual(logs2);
    });
  });

  describe('clearLogs', () => {
    it('should clear logs', () => {
      const log = { id: '1', level: 'info' as const, message: 'Log 1', timestamp: new Date().toISOString() };
      useStore.getState().addLog(log);
      useStore.getState().clearLogs();
      expect(useStore.getState().logs).toEqual([]);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', () => {
      useStore.getState().updateSettings({ theme: 'dark' as const });
      expect(useStore.getState().settings.theme).toBe('dark');
    });

    it('should merge settings', () => {
      useStore.getState().updateSettings({ theme: 'dark' as const });
      useStore.getState().updateSettings({ notifications: false });
      expect(useStore.getState().settings.theme).toBe('dark');
      expect(useStore.getState().settings.notifications).toBe(false);
    });

    it('should preserve other settings', () => {
      useStore.getState().updateSettings({ theme: 'dark' as const });
      expect(useStore.getState().settings.notifications).toBe(true);
      expect(useStore.getState().settings.autoRefresh).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useStore.getState().setLoading(true);
      expect(useStore.getState().status.isLoading).toBe(true);
      expect(useStore.getState().status.error).toBeNull();
    });

    it('should clear error when setting loading', () => {
      useStore.getState().setError('Test error');
      useStore.getState().setLoading(true);
      expect(useStore.getState().status.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error', () => {
      useStore.getState().setError('Test error');
      expect(useStore.getState().status.error).toBe('Test error');
    });

    it('should clear loading when setting error', () => {
      useStore.getState().setLoading(true);
      useStore.getState().setError('Test error');
      expect(useStore.getState().status.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useStore.getState().setError('Test error');
      useStore.getState().clearError();
      expect(useStore.getState().status.error).toBeNull();
    });

    it('should clear loading when clearing error', () => {
      useStore.getState().setLoading(true);
      useStore.getState().clearError();
      expect(useStore.getState().status.isLoading).toBe(false);
    });
  });

  describe('addChartData', () => {
    it('should add cpu data point', () => {
      useStore.getState().addChartData('cpu', 50);
      expect(useStore.getState().chartHistory.cpu).toHaveLength(1);
      expect(useStore.getState().chartHistory.cpu[0].value).toBe(50);
      expect(useStore.getState().chartHistory.cpu[0].time).toBeDefined();
      expect(useStore.getState().chartHistory.cpu[0].displayTime).toBeDefined();
    });

    it('should add memory data point', () => {
      useStore.getState().addChartData('memory', 60);
      expect(useStore.getState().chartHistory.memory).toHaveLength(1);
      expect(useStore.getState().chartHistory.memory[0].value).toBe(60);
    });

    it('should add requests data point', () => {
      useStore.getState().addChartData('requests', 10);
      expect(useStore.getState().chartHistory.requests).toHaveLength(1);
      expect(useStore.getState().chartHistory.requests[0].value).toBe(10);
    });

    it('should add gpuUtil data point', () => {
      useStore.getState().addChartData('gpuUtil', 80);
      expect(useStore.getState().chartHistory.gpuUtil).toHaveLength(1);
      expect(useStore.getState().chartHistory.gpuUtil[0].value).toBe(80);
    });

    it('should add power data point', () => {
      useStore.getState().addChartData('power', 150);
      expect(useStore.getState().chartHistory.power).toHaveLength(1);
      expect(useStore.getState().chartHistory.power[0].value).toBe(150);
    });

    it('should keep max 60 data points', () => {
      for (let i = 0; i < 65; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      expect(useStore.getState().chartHistory.cpu).toHaveLength(60);
      expect(useStore.getState().chartHistory.cpu[0].value).toBe(64);
      expect(useStore.getState().chartHistory.cpu[59].value).toBe(5);
    });

    it('should add data points in order', () => {
      useStore.getState().addChartData('cpu', 10);
      useStore.getState().addChartData('cpu', 20);
      useStore.getState().addChartData('cpu', 30);
      expect(useStore.getState().chartHistory.cpu[0].value).toBe(10);
      expect(useStore.getState().chartHistory.cpu[1].value).toBe(20);
      expect(useStore.getState().chartHistory.cpu[2].value).toBe(30);
    });
  });

  describe('trimChartData', () => {
    it('should trim data to default 60 points', () => {
      for (let i = 0; i < 100; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      useStore.getState().trimChartData();
      expect(useStore.getState().chartHistory.cpu).toHaveLength(60);
    });

    it('should trim data to custom max points', () => {
      for (let i = 0; i < 100; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      useStore.getState().trimChartData(30);
      expect(useStore.getState().chartHistory.cpu).toHaveLength(30);
    });

    it('should keep most recent data points', () => {
      for (let i = 0; i < 100; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      useStore.getState().trimChartData(20);
      expect(useStore.getState().chartHistory.cpu[0].value).toBe(80);
      expect(useStore.getState().chartHistory.cpu[19].value).toBe(99);
    });

    it('should not affect data with fewer points than max', () => {
      for (let i = 0; i < 30; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      useStore.getState().trimChartData(60);
      expect(useStore.getState().chartHistory.cpu).toHaveLength(30);
    });

    it('should trim all chart types', () => {
      for (let i = 0; i < 70; i++) {
        useStore.getState().addChartData('cpu', i);
        useStore.getState().addChartData('memory', i);
        useStore.getState().addChartData('requests', i);
        useStore.getState().addChartData('gpuUtil', i);
        useStore.getState().addChartData('power', i);
      }
      useStore.getState().trimChartData(50);
      expect(useStore.getState().chartHistory.cpu).toHaveLength(50);
      expect(useStore.getState().chartHistory.memory).toHaveLength(50);
      expect(useStore.getState().chartHistory.requests).toHaveLength(50);
      expect(useStore.getState().chartHistory.gpuUtil).toHaveLength(50);
      expect(useStore.getState().chartHistory.power).toHaveLength(50);
    });
  });

  describe('clearChartData', () => {
    it('should clear all chart data', () => {
      useStore.getState().addChartData('cpu', 10);
      useStore.getState().addChartData('memory', 20);
      useStore.getState().addChartData('requests', 30);
      useStore.getState().clearChartData();
      expect(useStore.getState().chartHistory.cpu).toEqual([]);
      expect(useStore.getState().chartHistory.memory).toEqual([]);
      expect(useStore.getState().chartHistory.requests).toEqual([]);
      expect(useStore.getState().chartHistory.gpuUtil).toEqual([]);
      expect(useStore.getState().chartHistory.power).toEqual([]);
    });
  });

  describe('selectors', () => {
    it('selectModels should return models', () => {
      const models = [
        { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' },
      ];
      useStore.getState().setModels(models);
      const selectedModels = useStore.getState().models;
      expect(selectedModels).toEqual(models);
    });

    it('selectActiveModel should return active model', () => {
      const model = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model);
      useStore.getState().setActiveModel('1');
      const state = useStore.getState();
      const activeModel = state.models.find((m) => m.id === state.activeModelId);
      expect(activeModel).toEqual(model);
    });

    it('selectActiveModel should return null when no active model', () => {
      const state = useStore.getState();
      const activeModel = state.models.find((m) => m.id === state.activeModelId);
      expect(activeModel).toBeNull();
    });

    it('selectMetrics should return metrics', () => {
      const metrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 2,
        totalRequests: 100,
        avgResponseTime: 100,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };
      useStore.getState().setMetrics(metrics);
      expect(useStore.getState().metrics).toEqual(metrics);
    });

    it('selectLogs should return logs', () => {
      const log = { id: '1', level: 'info' as const, message: 'Test log', timestamp: new Date().toISOString() };
      useStore.getState().addLog(log);
      expect(useStore.getState().logs).toContainEqual(log);
    });

    it('selectSettings should return settings', () => {
      const settings = useStore.getState().settings;
      expect(settings).toEqual({
        theme: 'light',
        notifications: true,
        autoRefresh: true,
      });
    });

    it('selectStatus should return status', () => {
      const status = useStore.getState().status;
      expect(status).toEqual({
        isLoading: false,
        error: null,
      });
    });

    it('selectChartHistory should return chart history', () => {
      useStore.getState().addChartData('cpu', 50);
      const chartHistory = useStore.getState().chartHistory;
      expect(chartHistory.cpu).toHaveLength(1);
    });
  });

  describe('persistence', () => {
    it('should persist to localStorage', () => {
      const models = [
        { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' },
      ];
      useStore.getState().setModels(models);
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it('should persist activeModelId', () => {
      useStore.getState().setActiveModel('1');
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it('should persist settings', () => {
      useStore.getState().updateSettings({ theme: 'dark' as const });
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it('should persist chart history', () => {
      useStore.getState().addChartData('cpu', 50);
      expect(mockStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should handle full model lifecycle', () => {
      const model = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '', updatedAt: '' };
      useStore.getState().addModel(model);
      useStore.getState().setActiveModel('1');
      useStore.getState().updateModel('1', { status: 'running' });
      useStore.getState().removeModel('1');
      expect(useStore.getState().models).toEqual([]);
      expect(useStore.getState().activeModelId).toBeNull();
    });

    it('should handle full logs lifecycle', () => {
      const log1 = { id: '1', level: 'info' as const, message: 'Log 1', timestamp: new Date().toISOString() };
      const log2 = { id: '2', level: 'error' as const, message: 'Log 2', timestamp: new Date().toISOString() };
      useStore.getState().addLog(log1);
      useStore.getState().addLog(log2);
      expect(useStore.getState().logs).toHaveLength(2);
      useStore.getState().clearLogs();
      expect(useStore.getState().logs).toEqual([]);
    });

    it('should handle full chart data lifecycle', () => {
      for (let i = 0; i < 70; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      expect(useStore.getState().chartHistory.cpu).toHaveLength(60);
      useStore.getState().trimChartData(30);
      expect(useStore.getState().chartHistory.cpu).toHaveLength(30);
      useStore.getState().clearChartData();
      expect(useStore.getState().chartHistory.cpu).toEqual([]);
    });
  });
});
