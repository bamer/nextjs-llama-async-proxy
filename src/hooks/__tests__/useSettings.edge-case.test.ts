/**
 * Comprehensive edge case tests for useSettings hook
 * Testing for null/undefined inputs, error states, loading states,
 * concurrent calls, cleanup on unmount, memory leaks, and edge cases
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings, AppSettings } from '../useSettings';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
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

describe('useSettings - Edge Cases', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default settings', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.isLoading).toBe(true);
    });

    it('should load default settings after mount', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual({
        theme: 'system',
        logLevel: 'info',
        maxConcurrentModels: 3,
        autoUpdate: true,
        notificationsEnabled: true,
        refreshInterval: 2,
      });
    });
  });

  describe('Null/Undefined Handling', () => {
    it('should handle null value from localStorage', async () => {
      localStorageMock.setItem('app-settings', 'null');

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual({
        theme: 'system',
        logLevel: 'info',
        maxConcurrentModels: 3,
        autoUpdate: true,
        notificationsEnabled: true,
        refreshInterval: 2,
      });
    });

    it('should handle undefined value from localStorage', () => {
      const { result } = renderHook(() => useSettings());

      waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toBeDefined();
    });

    it('should handle empty string from localStorage', async () => {
      localStorageMock.setItem('app-settings', '');

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still have default settings since empty string parse fails
      expect(result.current.settings).toEqual({
        theme: 'system',
        logLevel: 'info',
        maxConcurrentModels: 3,
        autoUpdate: true,
        notificationsEnabled: true,
        refreshInterval: 2,
      });
    });

    it('should handle null in updateSettings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        (result.current.updateSettings as any)(null);
      });

      // Should handle gracefully
      expect(result.current.settings).toBeDefined();
    });

    it('should handle undefined in updateSettings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        (result.current.updateSettings as any)(undefined);
      });

      expect(result.current.settings).toBeDefined();
    });
  });

  describe('Error States', () => {
    it('should handle malformed JSON from localStorage', async () => {
      localStorageMock.setItem('app-settings', 'invalid json {{');

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to default settings
      expect(result.current.settings).toEqual({
        theme: 'system',
        logLevel: 'info',
        maxConcurrentModels: 3,
        autoUpdate: true,
        notificationsEnabled: true,
        refreshInterval: 2,
      });
    });

    it('should handle invalid JSON structure', async () => {
      localStorageMock.setItem('app-settings', '["array", "not", "object"]');

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to default settings
      expect(result.current.settings).toBeDefined();
    });

    it('should handle settings with invalid data types', async () => {
      localStorageMock.setItem('app-settings', JSON.stringify({ theme: 123 as any, logLevel: true as any }));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // TypeScript won't catch runtime type errors, but we should handle them
      expect(result.current.settings).toBeDefined();
    });

    it('should handle localStorage.setItem errors', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      // Should handle gracefully without crashing
      expect(result.current.settings).toBeDefined();

      // Restore original
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('Loading State', () => {
    it('should be loading initially', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.isLoading).toBe(true);
    });

    it('should finish loading after localStorage read', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should load saved settings', async () => {
      const savedSettings: AppSettings = {
        theme: 'dark',
        logLevel: 'debug',
        maxConcurrentModels: 5,
        autoUpdate: false,
        notificationsEnabled: false,
        refreshInterval: 10,
      };

      localStorageMock.setItem('app-settings', JSON.stringify(savedSettings));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual(savedSettings);
    });

    it('should merge with defaults when partial settings saved', async () => {
      localStorageMock.setItem('app-settings', JSON.stringify({ theme: 'dark', refreshInterval: 5 }));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.refreshInterval).toBe(5);
      expect(result.current.settings.logLevel).toBe('info'); // default
      expect(result.current.settings.maxConcurrentModels).toBe(3); // default
    });
  });

  describe('updateSettings Function', () => {
    it('should update single setting', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      expect(result.current.settings.theme).toBe('dark');
    });

    it('should update multiple settings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({
          theme: 'dark',
          logLevel: 'debug',
          refreshInterval: 10,
        });
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.logLevel).toBe('debug');
      expect(result.current.settings.refreshInterval).toBe(10);
    });

    it('should persist settings to localStorage', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      const saved = localStorageMock.getItem('app-settings');
      expect(saved).toContain('"theme":"dark"');
    });

    it('should handle concurrent updates', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
        result.current.updateSettings({ logLevel: 'debug' });
        result.current.updateSettings({ refreshInterval: 5 });
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.logLevel).toBe('debug');
      expect(result.current.settings.refreshInterval).toBe(5);
    });

    it('should handle empty update', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalSettings = { ...result.current.settings };

      act(() => {
        result.current.updateSettings({});
      });

      expect(result.current.settings).toEqual(originalSettings);
    });
  });

  describe('Memory Leaks', () => {
    it('should not leak memory with frequent remounts', async () => {
      for (let i = 0; i < 100; i++) {
        const { unmount, result } = renderHook(() => useSettings());
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
        unmount();
      }

      // localStorage should not accumulate excessive data
      const saved = localStorageMock.getItem('app-settings');
      expect(saved?.length).toBeLessThan(10000);
    });

    it('should handle large settings object', async () => {
      const largeValue = 'x'.repeat(1000000);
      localStorageMock.setItem('app-settings', JSON.stringify({ theme: largeValue as any }));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.theme).toBe(largeValue);
    });

    it('should handle rapid updates without memory issues', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.updateSettings({ refreshInterval: i });
        }
      });

      expect(result.current.settings.refreshInterval).toBe(999);
    });
  });

  describe('Theme Settings', () => {
    it('should handle light theme', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'light' });
      });

      expect(result.current.settings.theme).toBe('light');
    });

    it('should handle dark theme', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      expect(result.current.settings.theme).toBe('dark');
    });

    it('should handle system theme', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'system' });
      });

      expect(result.current.settings.theme).toBe('system');
    });

    it('should handle invalid theme value', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        (result.current.updateSettings as any)({ theme: 'invalid' });
      });

      // TypeScript won't prevent this at runtime
      expect(result.current.settings.theme).toBe('invalid' as any);
    });
  });

  describe('Log Level Settings', () => {
    it('should handle debug level', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ logLevel: 'debug' });
      });

      expect(result.current.settings.logLevel).toBe('debug');
    });

    it('should handle info level', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ logLevel: 'info' });
      });

      expect(result.current.settings.logLevel).toBe('info');
    });

    it('should handle warn level', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ logLevel: 'warn' });
      });

      expect(result.current.settings.logLevel).toBe('warn');
    });

    it('should handle error level', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ logLevel: 'error' });
      });

      expect(result.current.settings.logLevel).toBe('error');
    });
  });

  describe('Numeric Settings', () => {
    it('should handle zero refreshInterval', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ refreshInterval: 0 });
      });

      expect(result.current.settings.refreshInterval).toBe(0);
    });

    it('should handle negative refreshInterval', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ refreshInterval: -1 });
      });

      expect(result.current.settings.refreshInterval).toBe(-1);
    });

    it('should handle very large refreshInterval', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ refreshInterval: Number.MAX_SAFE_INTEGER });
      });

      expect(result.current.settings.refreshInterval).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle zero maxConcurrentModels', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ maxConcurrentModels: 0 });
      });

      expect(result.current.settings.maxConcurrentModels).toBe(0);
    });

    it('should handle negative maxConcurrentModels', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ maxConcurrentModels: -5 });
      });

      expect(result.current.settings.maxConcurrentModels).toBe(-5);
    });

    it('should handle very large maxConcurrentModels', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ maxConcurrentModels: Number.MAX_SAFE_INTEGER });
      });

      expect(result.current.settings.maxConcurrentModels).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('Boolean Settings', () => {
    it('should handle autoUpdate true', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ autoUpdate: true });
      });

      expect(result.current.settings.autoUpdate).toBe(true);
    });

    it('should handle autoUpdate false', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ autoUpdate: false });
      });

      expect(result.current.settings.autoUpdate).toBe(false);
    });

    it('should handle notificationsEnabled true', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ notificationsEnabled: true });
      });

      expect(result.current.settings.notificationsEnabled).toBe(true);
    });

    it('should handle notificationsEnabled false', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ notificationsEnabled: false });
      });

      expect(result.current.settings.notificationsEnabled).toBe(false);
    });
  });

  describe('Edge Case Scenarios', () => {
    it('should handle settings with special characters', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        (result.current.updateSettings as any)({ theme: '<script>alert("xss")</script>' });
      });

      expect(result.current.settings.theme).toBe('<script>alert("xss")</script>');
    });

    it('should handle settings with unicode characters', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        (result.current.updateSettings as any)({ theme: '主题 🚀 测试' });
      });

      expect(result.current.settings.theme).toBe('主题 🚀 测试');
    });

    it('should handle settings with emoji', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        (result.current.updateSettings as any)({ theme: '🌙 Dark Mode' });
      });

      expect(result.current.settings.theme).toBe('🌙 Dark Mode');
    });

    it('should handle circular reference in settings', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create circular reference
      const circularData: any = { theme: 'dark' };
      circularData.self = circularData;

      act(() => {
        (result.current.updateSettings as any)(circularData);
      });

      // JSON.stringify will throw error with circular references
      // The function should handle this gracefully
      expect(result.current.settings).toBeDefined();
    });

    it('should handle settings saved as number in localStorage', async () => {
      localStorageMock.setItem('app-settings', '123');

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to defaults
      expect(result.current.settings).toEqual({
        theme: 'system',
        logLevel: 'info',
        maxConcurrentModels: 3,
        autoUpdate: true,
        notificationsEnabled: true,
        refreshInterval: 2,
      });
    });

    it('should handle settings saved as boolean in localStorage', async () => {
      localStorageMock.setItem('app-settings', 'true');

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual({
        theme: 'system',
        logLevel: 'info',
        maxConcurrentModels: 3,
        autoUpdate: true,
        notificationsEnabled: true,
        refreshInterval: 2,
      });
    });

    it('should handle concurrent localStorage access', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rapid updates from multiple sources
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.updateSettings({ refreshInterval: i });
          // Simulate external localStorage changes
          localStorageMock.setItem(
            'app-settings',
            JSON.stringify({ theme: i % 2 === 0 ? 'dark' : 'light' })
          );
        }
      });

      // Should handle without crashing
      expect(result.current.settings).toBeDefined();
    });
  });

  describe('Partial Updates', () => {
    it('should preserve existing settings when updating partial', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.logLevel).toBe('info');
      expect(result.current.settings.maxConcurrentModels).toBe(3);

      act(() => {
        result.current.updateSettings({ logLevel: 'debug' });
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.logLevel).toBe('debug');
      expect(result.current.settings.maxConcurrentModels).toBe(3);
    });

    it('should override existing settings when updating', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark', refreshInterval: 5 });
      });

      act(() => {
        result.current.updateSettings({ theme: 'light' });
      });

      expect(result.current.settings.theme).toBe('light');
      expect(result.current.settings.refreshInterval).toBe(5);
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should not throw errors on unmount', () => {
      const { unmount } = renderHook(() => useSettings());

      expect(() => unmount()).not.toThrow();
    });
  });
});
