/**
 * AGENT 1: Core Library Enhancement Tests - Store Data Operations
 * ========================================
 * Purpose: Store model, log, and chart data operations tests
 * Target File: store.ts (91.83% → 98%)
 */

import { act } from '@testing-library/react';
import { useStore } from '@/lib/store';

describe('Store - Enhanced Coverage (Data Operations)', () => {
  beforeEach(() => {
    act(() => {
      useStore.setState({
        models: [],
        activeModelId: null,
        metrics: null,
        logs: [],
        settings: { theme: 'system' as const, notifications: true, autoRefresh: true },
        status: { isLoading: false, error: null, llamaServerStatus: 'stopped' as const },
        chartHistory: { cpu: [], memory: [], requests: [], gpuUtil: [], power: [] },
      });
    });
  });

  describe('Model operations edge cases', () => {
    it('should not update non-existent model', () => {
      act(() => {
        useStore.getState().setModels([{ id: '1', name: 'Model 1' }] as any);
        useStore.getState().updateModel('999', { name: 'Updated' });
      });
      expect(useStore.getState().models[0].name).toBe('Model 1');
    });

    it('should remove active model and clear activeModelId', () => {
      act(() => {
        useStore.getState().addModel({ id: '1', name: 'Model 1' } as any);
        useStore.getState().setActiveModel('1');
        useStore.getState().removeModel('1');
      });
      expect(useStore.getState().models).toHaveLength(0);
      expect(useStore.getState().activeModelId).toBeNull();
    });

    it('should not clear activeModelId when removing different model', () => {
      act(() => {
        useStore.getState().addModel({ id: '1', name: 'Model 1' } as any);
        useStore.getState().addModel({ id: '2', name: 'Model 2' } as any);
        useStore.getState().setActiveModel('1');
        useStore.getState().removeModel('2');
      });
      expect(useStore.getState().activeModelId).toBe('1');
    });
  });

  describe('Log operations edge cases', () => {
    it('should prepend new logs (FIFO)', () => {
      act(() => {
        useStore.getState().addLog({ id: 'log1', timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'First' } as any);
        useStore.getState().addLog({ id: 'log2', timestamp: '2024-01-01T00:01:00Z', level: 'info', message: 'Second' } as any);
      });
      expect(useStore.getState().logs[0].id).toBe('log2');
      expect(useStore.getState().logs[1].id).toBe('log1');
    });

    it('should enforce 100 log limit on addLog', () => {
      act(() => {
        for (let i = 0; i < 105; i++) {
          useStore.getState().addLog({ id: `log${i}`, timestamp: '2024-01-01T00:00:00Z', level: 'info', message: `Message ${i}` } as any);
        }
      });
      expect(useStore.getState().logs).toHaveLength(100);
      expect(useStore.getState().logs[0].id).toBe('log104');
    });

    it('should replace all logs with setLogs', () => {
      act(() => {
        useStore.getState().addLog({ id: 'old', timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Old' } as any);
        const newLogs = [
          { id: 'new1', timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'New1' },
          { id: 'new2', timestamp: '2024-01-01T00:01:00Z', level: 'info', message: 'New2' },
        ] as any;
        useStore.getState().setLogs(newLogs);
      });
      expect(useStore.getState().logs).toHaveLength(2);
      expect(useStore.getState().logs[0].id).toBe('new1');
    });
  });

  describe('Chart data edge cases', () => {
    it('should add data points to different chart types independently', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().addChartData('memory', 60);
        useStore.getState().addChartData('requests', 100);
      });
      const history = useStore.getState().chartHistory;
      expect(history.cpu).toHaveLength(1);
      expect(history.memory).toHaveLength(1);
      expect(history.requests).toHaveLength(1);
      expect(history.cpu[0].value).toBe(50);
      expect(history.memory[0].value).toBe(60);
      expect(history.requests[0].value).toBe(100);
    });

    it('should trim with zero maxPoints clears all', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().addChartData('memory', 60);
        useStore.getState().trimChartData(0);
      });
      const history = useStore.getState().chartHistory;
      expect(history.cpu).toHaveLength(0);
      expect(history.memory).toHaveLength(0);
    });

    it('should trim with negative maxPoints clears all', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().trimChartData(-1);
      });
      expect(useStore.getState().chartHistory.cpu).toHaveLength(0);
    });

    it('should not trim if under maxPoints', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().addChartData('cpu', 60);
        useStore.getState().trimChartData(10);
      });
      expect(useStore.getState().chartHistory.cpu).toHaveLength(2);
    });

    it('should keep only the first maxPoints when trimming', () => {
      act(() => {
        for (let i = 0; i < 100; i++) {
          useStore.getState().addChartData('memory', i);
        }
        // After adding 100 items, only last 60 remain (40-99)
        // After trimming to 50, we get first 50 of those (40-89)
        useStore.getState().trimChartData(50);
      });
      const data = useStore.getState().chartHistory.memory;
      expect(data).toHaveLength(50);
      expect(data[0].value).toBe(40);
      expect(data[49].value).toBe(89);
    });
  });
});
