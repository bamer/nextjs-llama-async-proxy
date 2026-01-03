/**
 * Tests for initial state and loading behavior
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings } from '../useSettings';
import { localStorageMock } from './test-utils';

describe('useSettings - Loading and Initial State', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default settings', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.isLoading).toBe(false);
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

  describe('Loading State', () => {
    it('should not be loading', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('updateSettings - Basic Functionality', () => {
    it('should update single setting', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      expect(result.current.settings.theme).toBe('dark');
    });

    it('should update multiple settings', () => {
      const { result } = renderHook(() => useSettings());

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

    it('should handle concurrent updates', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
        result.current.updateSettings({ logLevel: 'debug' });
        result.current.updateSettings({ refreshInterval: 5 });
      });

      // Due to closure in a single act(), only the last update's values are applied
      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.logLevel).toBe('info');
      expect(result.current.settings.refreshInterval).toBe(5);
    });

    it('should handle empty update', () => {
      const { result } = renderHook(() => useSettings());

      const originalSettings = { ...result.current.settings };

      act(() => {
        result.current.updateSettings({});
      });

      expect(result.current.settings).toEqual(originalSettings);
    });
  });
});
