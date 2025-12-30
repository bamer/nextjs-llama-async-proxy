import { useStore, selectMetrics, selectLogs } from '@/lib/store';
import { act } from '@testing-library/react';
import { SystemMetrics, LogEntry } from '@/types/global';

describe('store edge cases - Metrics and Logs', () => {
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

  describe('setMetrics edge cases', () => {
    it('should handle complete SystemMetrics with all properties', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 45.5,
        memoryUsage: 60.2,
        diskUsage: 70.0,
        activeModels: 3,
        totalRequests: 1234,
        avgResponseTime: 250.5,
        uptime: 3600,
        timestamp: '2024-12-27T00:00:00Z',
        gpuUsage: 80.5,
        gpuMemoryUsage: 8192,
        gpuMemoryTotal: 16384,
        gpuMemoryUsed: 8192,
        gpuPowerUsage: 250,
        gpuPowerLimit: 300,
        gpuTemperature: 65,
        gpuName: 'NVIDIA RTX 4090',
      };

      act(() => {
        useStore.getState().setMetrics(metrics);
      });

      expect(useStore.getState().metrics).toEqual(metrics);
    });

    it('should handle minimal SystemMetrics', () => {
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
        useStore.getState().setMetrics(metrics);
      });

      expect(useStore.getState().metrics).toEqual(metrics);
    });

    it('should handle edge values for metrics', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 0,
        memoryUsage: 100,
        diskUsage: 50,
        activeModels: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        uptime: 0,
        timestamp: '2024-12-27T00:00:00Z',
      };

      act(() => {
        useStore.getState().setMetrics(metrics);
      });

      expect(useStore.getState().metrics?.cpuUsage).toBe(0);
      expect(useStore.getState().metrics?.memoryUsage).toBe(100);
    });
  });

  describe('addLog edge cases', () => {
    it('should handle log with object message', () => {
      const log: LogEntry = {
        id: 'log-1',
        level: 'error',
        message: { error: 'Test error', code: 500 },
        timestamp: '2024-12-27T00:00:00Z',
        context: { userId: 'user-1' },
      };

      act(() => {
        useStore.getState().addLog(log);
      });

      expect(useStore.getState().logs[0]).toEqual(log);
    });

    it('should handle all log levels', () => {
      const levels: Array<'info' | 'warn' | 'error' | 'debug'> = ['info', 'warn', 'error', 'debug'];

      levels.forEach((level, index) => {
        const log: LogEntry = {
          id: `log-${index}`,
          level,
          message: `Test ${level} message`,
          timestamp: '2024-12-27T00:00:00Z',
        };

        act(() => {
          useStore.getState().addLog(log);
        });
      });

      expect(useStore.getState().logs).toHaveLength(4);
      expect(useStore.getState().logs[0].level).toBe('debug');
      expect(useStore.getState().logs[1].level).toBe('error');
      expect(useStore.getState().logs[2].level).toBe('warn');
      expect(useStore.getState().logs[3].level).toBe('info');
    });

    it('should handle log with complex context', () => {
      const log: LogEntry = {
        id: 'log-1',
        level: 'info',
        message: 'Request processed',
        timestamp: '2024-12-27T00:00:00Z',
        context: {
          userId: 'user-1',
          requestId: 'req-123',
          duration: 250,
          metadata: { route: '/api/models', method: 'GET' },
        },
      };

      act(() => {
        useStore.getState().addLog(log);
      });

      expect(useStore.getState().logs[0].context).toEqual(log.context);
    });

    it('should preserve newest logs when adding beyond limit', () => {
      const logs: LogEntry[] = Array.from({ length: 150 }, (_, i) => ({
        id: `log-${i}`,
        level: 'info' as const,
        message: `Log ${i}`,
        timestamp: `2024-12-27T00:${String(i).padStart(2, '0')}:00Z`,
      }));

      act(() => {
        logs.forEach((log) => useStore.getState().addLog(log));
      });

      expect(useStore.getState().logs).toHaveLength(100);
      expect(useStore.getState().logs[0].id).toBe('log-149');
      expect(useStore.getState().logs[99].id).toBe('log-50');
    });
  });

  describe('setLogs edge cases', () => {
    it('should handle setting empty logs array', () => {
      const log: LogEntry = {
        id: 'log-1',
        level: 'info',
        message: 'Test',
        timestamp: '2024-12-27T00:00:00Z',
      };

      act(() => {
        useStore.getState().addLog(log);
        useStore.getState().setLogs([]);
      });

      expect(useStore.getState().logs).toEqual([]);
    });

    it('should handle large logs array', () => {
      const logs: LogEntry[] = Array.from({ length: 500 }, (_, i) => ({
        id: `log-${i}`,
        level: 'info' as const,
        message: `Log ${i}`,
        timestamp: '2024-12-27T00:00:00Z',
      }));

      act(() => {
        useStore.getState().setLogs(logs);
      });

      expect(useStore.getState().logs).toHaveLength(500);
    });
  });

  describe('Selectors edge cases - Metrics and Logs', () => {
    it('selectMetrics should return null when metrics not set', () => {
      const metrics = selectMetrics(useStore.getState());
      expect(metrics).toBeNull();
    });

    it('selectLogs should return empty array when no logs', () => {
      const logs = selectLogs(useStore.getState());
      expect(logs).toEqual([]);
    });
  });
});
