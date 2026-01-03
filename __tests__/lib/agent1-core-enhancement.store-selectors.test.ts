/**
 * AGENT 1: Core Library Enhancement Tests - Store Selectors & Settings
 * ========================================
 * Purpose: Store settings, status, and selector tests
 * Target File: store.ts (91.83% → 98%)
 */

import { act } from '@testing-library/react';
import {
  useStore,
  selectModels,
  selectActiveModel,
  selectMetrics,
  selectLogs,
  selectSettings,
  selectStatus,
  selectChartHistory,
} from '@/lib/store';

describe('Store - Enhanced Coverage (Settings & Selectors)', () => {
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

  describe('Settings edge cases', () => {
    it('should preserve other settings when updating one', () => {
      act(() => {
        useStore.getState().updateSettings({ theme: 'dark' as const });
      });
      const settings = useStore.getState().settings;
      expect(settings.theme).toBe('dark');
      expect(settings.notifications).toBe(true);
      expect(settings.autoRefresh).toBe(true);
    });

    it('should allow updating all settings at once', () => {
      act(() => {
        useStore.getState().updateSettings({
          theme: 'light' as const,
          notifications: false,
          autoRefresh: false,
        });
      });
      const settings = useStore.getState().settings;
      expect(settings.theme).toBe('light');
      expect(settings.notifications).toBe(false);
      expect(settings.autoRefresh).toBe(false);
    });
  });

  describe('Status edge cases', () => {
    it('should clear error while maintaining loading state', () => {
      act(() => {
        useStore.getState().setLoading(true);
        useStore.getState().setError('Some error');
        useStore.getState().clearError();
      });
      const status = useStore.getState().status;
      expect(status.error).toBeNull();
      expect(status.isLoading).toBe(true);
    });

    it('should setLoading preserve previous error', () => {
      act(() => {
        useStore.getState().setError('Previous error');
        useStore.getState().setLoading(true);
      });
      const status = useStore.getState().status;
      expect(status.isLoading).toBe(true);
      expect(status.error).toBe('Previous error');
    });

    it('should setError preserve previous loading state', () => {
      act(() => {
        useStore.getState().setLoading(true);
        useStore.getState().setError('New error');
      });
      const status = useStore.getState().status;
      expect(status.isLoading).toBe(true);
      expect(status.error).toBe('New error');
    });
  });

  describe('Selector functions comprehensive', () => {
    it('selectModels returns empty array initially', () => {
      expect(selectModels(useStore.getState())).toEqual([]);
    });

    it('selectActiveModel returns null when no active model', () => {
      expect(selectActiveModel(useStore.getState())).toBeNull();
    });

    it('selectActiveModel returns null when activeModelId not found', () => {
      act(() => {
        useStore.getState().setModels([{ id: '1', name: 'Model 1' }] as any);
        useStore.getState().setActiveModel('999');
      });
      expect(selectActiveModel(useStore.getState())).toBeNull();
    });

    it('selectMetrics returns null initially', () => {
      expect(selectMetrics(useStore.getState())).toBeNull();
    });

    it('selectLogs returns empty array initially', () => {
      expect(selectLogs(useStore.getState())).toEqual([]);
    });

    it('selectSettings returns all three properties', () => {
      const settings = selectSettings(useStore.getState());
      expect(settings).toHaveProperty('theme');
      expect(settings).toHaveProperty('notifications');
      expect(settings).toHaveProperty('autoRefresh');
    });

    it('selectStatus returns both isLoading and error', () => {
      const status = selectStatus(useStore.getState());
      expect(status).toHaveProperty('isLoading');
      expect(status).toHaveProperty('error');
    });

    it('selectChartHistory returns all five chart types', () => {
      const history = selectChartHistory(useStore.getState());
      expect(history).toHaveProperty('cpu');
      expect(history).toHaveProperty('memory');
      expect(history).toHaveProperty('requests');
      expect(history).toHaveProperty('gpuUtil');
      expect(history).toHaveProperty('power');
    });
  });

  describe('Persistence edge cases', () => {
    it('should persist only specified fields', () => {
      act(() => {
        useStore.getState().setModels([{ id: '1', name: 'Model 1' }] as any);
        useStore.getState().setMetrics({ cpu: 50 } as any);
        useStore.getState().addLog({ id: 'log1', timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'test' } as any);
      });
      const state = useStore.getState();
      expect(state.models).toHaveLength(1);
      expect(state.models[0].id).toBe('1');
      expect(state.activeModelId).toBeNull();
      expect(state.settings).toBeDefined();
      expect(state.chartHistory).toBeDefined();
    });
  });
});
