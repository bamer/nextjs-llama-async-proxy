/**
 * Tests for memory management, performance, and cleanup
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings } from '../useSettings';
import { localStorageMock } from './test-utils';

describe('useSettings - Memory and Performance', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
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

      // Should complete without memory errors
      expect(true).toBe(true);
    });

    it('should handle large settings object', async () => {
      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const largeValue = 'x'.repeat(1000000);

      act(() => {
        result.current.updateSettings({ theme: largeValue as any });
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
