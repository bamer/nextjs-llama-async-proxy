import { useStore, selectModels, selectActiveModel, selectMetrics, selectLogs, selectSettings, selectStatus, selectChartHistory } from '@/lib/store';
import { ModelConfig, SystemMetrics, LogEntry, ThemeMode } from '@/types/global';

describe('store', () => {
  beforeEach(() => {
    localStorage.clear();
    const state = useStore.getState();
    state.setModels([]);
    state.setActiveModel(null);
    state.clearLogs?.();
    state.clearChartData?.();
  });

  afterEach(() => {
    const state = useStore.getState();
    state.setModels([]);
    state.setActiveModel(null);
    state.clearLogs?.();
    state.clearChartData?.();
  });

  describe('initial state', () => {
    it('should have empty models array', () => {
      const models = useStore.getState().models;
      expect(models).toEqual([]);
    });

    it('should have null activeModelId', () => {
      const activeModelId = useStore.getState().activeModelId;
      expect(activeModelId).toBeNull();
    });

    it('should have null metrics', () => {
      const metrics = useStore.getState().metrics;
      expect(metrics).toBeNull();
    });

    it('should have empty logs array', () => {
      const logs = useStore.getState().logs;
      expect(logs).toEqual([]);
    });

    it('should have default settings', () => {
      const settings = useStore.getState().settings;
      expect(settings).toHaveProperty('theme');
      expect(settings).toHaveProperty('notifications');
      expect(settings).toHaveProperty('autoRefresh');
    });

    it('should have initial status', () => {
      const status = useStore.getState().status;
      expect(status).toEqual({
        isLoading: false,
        error: null,
      });
    });

    it('should have empty chart history', () => {
      const chartHistory = useStore.getState().chartHistory;
      expect(chartHistory).toEqual({
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      });
    });
  });

  describe('setModels', () => {
    it('should set models array', () => {
      const models: ModelConfig[] = [
        { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];

      useStore.getState().setModels(models);
      const stateModels = useStore.getState().models;

      expect(stateModels).toEqual(models);
    });

    it('should replace existing models', () => {
      const initialModels: ModelConfig[] = [
        { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      useStore.getState().setModels(initialModels);

      const newModels: ModelConfig[] = [
        { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ];
      useStore.getState().setModels(newModels);

      expect(useStore.getState().models).toEqual(newModels);
    });
  });

  describe('addModel', () => {
    it('should add model to models array', () => {
      const model: ModelConfig = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      useStore.getState().addModel(model);
      const models = useStore.getState().models;

      expect(models).toHaveLength(1);
      expect(models[0]).toEqual(model);
    });

    it('should append model to end of array', () => {
      const model1: ModelConfig = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      const model2: ModelConfig = { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      useStore.getState().addModel(model1);
      useStore.getState().addModel(model2);

      const models = useStore.getState().models;
      expect(models[0]).toEqual(model1);
      expect(models[1]).toEqual(model2);
    });
  });

  describe('updateModel', () => {
    it('should update model by id', () => {
      const model: ModelConfig = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      useStore.getState().addModel(model);

      useStore.getState().updateModel('1', { status: 'running' });
      const models = useStore.getState().models;

      expect(models[0].status).toBe('running');
    });

    it('should not update other models', () => {
      const model1: ModelConfig = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      const model2: ModelConfig = { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      useStore.getState().addModel(model1);
      useStore.getState().addModel(model2);

      useStore.getState().updateModel('1', { status: 'running' });
      const models = useStore.getState().models;

      expect(models[0].status).toBe('running');
      expect(models[1].status).toBe('idle');
    });

    it('should handle non-existent model id', () => {
      useStore.getState().updateModel('999', { status: 'running' });
      const models = useStore.getState().models;

      expect(models).toEqual([]);
    });
  });

  describe('removeModel', () => {
    it('should remove model by id', () => {
      const model1: ModelConfig = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      const model2: ModelConfig = { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      useStore.getState().addModel(model1);
      useStore.getState().addModel(model2);

      useStore.getState().removeModel('1');
      const models = useStore.getState().models;

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('2');
    });

    it('should clear activeModelId if removing active model', () => {
      const model: ModelConfig = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      useStore.getState().addModel(model);
      useStore.getState().setActiveModel('1');

      useStore.getState().removeModel('1');
      const activeModelId = useStore.getState().activeModelId;

      expect(activeModelId).toBeNull();
    });

    it('should not clear activeModelId if removing different model', () => {
      const model1: ModelConfig = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      const model2: ModelConfig = { id: '2', name: 'Model 2', type: 'mistral', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      useStore.getState().addModel(model1);
      useStore.getState().addModel(model2);
      useStore.getState().setActiveModel('1');

      useStore.getState().removeModel('2');
      const activeModelId = useStore.getState().activeModelId;

      expect(activeModelId).toBe('1');
    });
  });

  describe('setActiveModel', () => {
    it('should set activeModelId', () => {
      useStore.getState().setActiveModel('model-1');
      const activeModelId = useStore.getState().activeModelId;

      expect(activeModelId).toBe('model-1');
    });

    it('should allow setting null', () => {
      useStore.getState().setActiveModel('model-1');
      useStore.getState().setActiveModel(null);
      const activeModelId = useStore.getState().activeModelId;

      expect(activeModelId).toBeNull();
    });
  });

  describe('setMetrics', () => {
    it('should set metrics', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 2,
        totalRequests: 100,
        avgResponseTime: 250,
        uptime: 3600,
        timestamp: '2024-01-01T00:00:00Z',
      };

      useStore.getState().setMetrics(metrics);
      const stateMetrics = useStore.getState().metrics;

      expect(stateMetrics).toEqual(metrics);
    });

    it('should allow setting null metrics', () => {
      useStore.getState().setMetrics(null);
      const metrics = useStore.getState().metrics;

      expect(metrics).toBeNull();
    });
  });

  describe('addLog', () => {
    it('should add log to beginning of logs array', () => {
      const log1: LogEntry = { id: '1', level: 'info', message: 'Log 1', timestamp: '2024-01-01T00:00:00Z' };
      const log2: LogEntry = { id: '2', level: 'error', message: 'Log 2', timestamp: '2024-01-01T00:01:00Z' };

      useStore.getState().addLog(log1);
      useStore.getState().addLog(log2);
      const logs = useStore.getState().logs;

      expect(logs).toHaveLength(2);
      expect(logs[0]).toEqual(log2);
      expect(logs[1]).toEqual(log1);
    });

    it('should limit logs to 100 entries', () => {
      for (let i = 0; i < 150; i++) {
        const log: LogEntry = { id: String(i), level: 'info', message: `Log ${i}`, timestamp: '2024-01-01T00:00:00Z' };
        useStore.getState().addLog(log);
      }

      const logs = useStore.getState().logs;
      expect(logs).toHaveLength(100);
    });
  });

  describe('setLogs', () => {
    it('should replace logs array', () => {
      const logs: LogEntry[] = [
        { id: '1', level: 'info', message: 'Log 1', timestamp: '2024-01-01T00:00:00Z' },
        { id: '2', level: 'error', message: 'Log 2', timestamp: '2024-01-01T00:01:00Z' },
      ];

      useStore.getState().setLogs(logs);
      const stateLogs = useStore.getState().logs;

      expect(stateLogs).toEqual(logs);
    });
  });

  describe('clearLogs', () => {
    it('should clear logs array', () => {
      const log: LogEntry = { id: '1', level: 'info', message: 'Log 1', timestamp: '2024-01-01T00:00:00Z' };
      useStore.getState().addLog(log);

      useStore.getState().clearLogs();
      const logs = useStore.getState().logs;

      expect(logs).toEqual([]);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', () => {
      useStore.getState().updateSettings({ theme: 'dark' });
      const settings = useStore.getState().settings;

      expect(settings.theme).toBe('dark');
    });

    it('should preserve other settings', () => {
      useStore.getState().updateSettings({ theme: 'dark' });
      useStore.getState().updateSettings({ notifications: false });
      const settings = useStore.getState().settings;

      expect(settings.theme).toBe('dark');
      expect(settings.notifications).toBe(false);
      expect(settings.autoRefresh).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useStore.getState().setLoading(true);
      const status = useStore.getState().status;

      expect(status.isLoading).toBe(true);
    });

    it('should clear error when setting loading', () => {
      useStore.getState().setError('Test error');
      useStore.getState().setLoading(true);
      const status = useStore.getState().status;

      expect(status.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error', () => {
      useStore.getState().setError('Test error');
      const status = useStore.getState().status;

      expect(status.error).toBe('Test error');
    });

    it('should clear loading when setting error', () => {
      useStore.getState().setLoading(true);
      useStore.getState().setError('Test error');
      const status = useStore.getState().status;

      expect(status.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useStore.getState().setError('Test error');
      useStore.getState().clearError();
      const status = useStore.getState().status;

      expect(status.error).toBeNull();
    });
  });

  describe('addChartData', () => {
    it('should add data point to chart', () => {
      useStore.getState().addChartData('cpu', 50);
      const chartHistory = useStore.getState().chartHistory;

      expect(chartHistory.cpu).toHaveLength(1);
      expect(chartHistory.cpu[0].value).toBe(50);
    });

    it('should limit chart data to 60 points', () => {
      for (let i = 0; i < 70; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      const chartHistory = useStore.getState().chartHistory;

      expect(chartHistory.cpu).toHaveLength(60);
    });

    it('should remove oldest point when exceeding limit', () => {
      for (let i = 0; i < 65; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      const chartHistory = useStore.getState().chartHistory;

      expect(chartHistory.cpu[0].value).toBe(5);
      expect(chartHistory.cpu[64].value).toBe(64);
    });

    it('should include timestamp', () => {
      useStore.getState().addChartData('memory', 60);
      const chartHistory = useStore.getState().chartHistory;

      expect(chartHistory.memory[0]).toHaveProperty('time');
      expect(chartHistory.memory[0]).toHaveProperty('displayTime');
    });
  });

  describe('trimChartData', () => {
    it('should trim chart data to default max points', () => {
      for (let i = 0; i < 70; i++) {
        useStore.getState().addChartData('cpu', i);
      }
      useStore.getState().trimChartData(50);
      const chartHistory = useStore.getState().chartHistory;

      expect(chartHistory.cpu).toHaveLength(50);
    });

    it('should trim all chart types', () => {
      for (let i = 0; i < 70; i++) {
        useStore.getState().addChartData('cpu', i);
        useStore.getState().addChartData('memory', i);
        useStore.getState().addChartData('requests', i);
      }
      useStore.getState().trimChartData(40);

      const chartHistory = useStore.getState().chartHistory;
      expect(chartHistory.cpu).toHaveLength(40);
      expect(chartHistory.memory).toHaveLength(40);
      expect(chartHistory.requests).toHaveLength(40);
    });
  });

  describe('clearChartData', () => {
    it('should clear all chart data', () => {
      useStore.getState().addChartData('cpu', 50);
      useStore.getState().addChartData('memory', 60);
      useStore.getState().clearChartData();
      const chartHistory = useStore.getState().chartHistory;

      expect(chartHistory.cpu).toEqual([]);
      expect(chartHistory.memory).toEqual([]);
      expect(chartHistory.requests).toEqual([]);
      expect(chartHistory.gpuUtil).toEqual([]);
      expect(chartHistory.power).toEqual([]);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      const model: ModelConfig = { id: '1', name: 'Model 1', type: 'llama', parameters: {}, status: 'idle', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
      useStore.getState().addModel(model);
      useStore.getState().setActiveModel('1');
    });

    it('selectModels should return models', () => {
      const state = useStore.getState();
      const models = selectModels(state);

      expect(models).toHaveLength(1);
    });

    it('selectActiveModel should return active model', () => {
      const state = useStore.getState();
      const activeModel = selectActiveModel(state);

      expect(activeModel).not.toBeNull();
      expect(activeModel?.id).toBe('1');
    });

    it('selectActiveModel should return null when no active model', () => {
      useStore.getState().setActiveModel(null);
      const state = useStore.getState();
      const activeModel = selectActiveModel(state);

      expect(activeModel).toBeNull();
    });

    it('selectMetrics should return metrics', () => {
      const state = useStore.getState();
      const metrics = selectMetrics(state);

      expect(metrics).toBeNull();
    });

    it('selectLogs should return logs', () => {
      const state = useStore.getState();
      const logs = selectLogs(state);

      expect(logs).toEqual([]);
    });

    it('selectSettings should return settings', () => {
      const state = useStore.getState();
      const settings = selectSettings(state);

      expect(settings).toHaveProperty('theme');
      expect(settings).toHaveProperty('notifications');
      expect(settings).toHaveProperty('autoRefresh');
    });

    it('selectStatus should return status', () => {
      const state = useStore.getState();
      const status = selectStatus(state);

      expect(status).toHaveProperty('isLoading');
      expect(status).toHaveProperty('error');
    });

    it('selectChartHistory should return chart history', () => {
      const state = useStore.getState();
      const chartHistory = selectChartHistory(state);

      expect(chartHistory).toHaveProperty('cpu');
      expect(chartHistory).toHaveProperty('memory');
      expect(chartHistory).toHaveProperty('requests');
      expect(chartHistory).toHaveProperty('gpuUtil');
      expect(chartHistory).toHaveProperty('power');
    });
  });
});
