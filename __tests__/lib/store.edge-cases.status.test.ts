import { useStore } from '@/lib/store';
import { act } from '@testing-library/react';
import { ThemeMode } from '@/contexts/ThemeContext';

describe('store edge cases - Settings and Status', () => {
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

  describe('updateSettings edge cases', () => {
    it('should handle updating all settings at once', () => {
      act(() => {
        useStore.getState().updateSettings({
          theme: 'dark',
          notifications: false,
          autoRefresh: false,
        });
      });

      const settings = useStore.getState().settings;
      expect(settings.theme).toBe('dark');
      expect(settings.notifications).toBe(false);
      expect(settings.autoRefresh).toBe(false);
    });

    it('should handle all theme modes', () => {
      const themes: ThemeMode[] = ['light', 'dark', 'system'];

      themes.forEach((theme) => {
        act(() => {
          useStore.getState().updateSettings({ theme });
        });

        expect(useStore.getState().settings.theme).toBe(theme);
      });
    });

    it('should preserve settings when updating with empty object', () => {
      const initialSettings = useStore.getState().settings;

      act(() => {
        useStore.getState().updateSettings({});
      });

      expect(useStore.getState().settings).toEqual(initialSettings);
    });
  });

  describe('setLoading and setError edge cases', () => {
    it('should handle rapid state changes', () => {
      act(() => {
        useStore.getState().setLoading(true);
        useStore.getState().setLoading(false);
        useStore.getState().setLoading(true);
        useStore.getState().setError('Test error');
        useStore.getState().setLoading(true);
      });

      expect(useStore.getState().status.isLoading).toBe(true);
      expect(useStore.getState().status.error).toBeNull();
    });

    it('should handle clearing error and setting loading', () => {
      act(() => {
        useStore.getState().setError('Test error');
        useStore.getState().setLoading(true);
      });

      expect(useStore.getState().status.isLoading).toBe(true);
      expect(useStore.getState().status.error).toBeNull();
    });

    it('should handle setting empty error string', () => {
      act(() => {
        useStore.getState().setError('');
      });

      expect(useStore.getState().status.error).toBe('');
    });

    it('should handle setting long error message', () => {
      const longError = 'A'.repeat(1000);

      act(() => {
        useStore.getState().setError(longError);
      });

      expect(useStore.getState().status.error).toBe(longError);
    });
  });
});
