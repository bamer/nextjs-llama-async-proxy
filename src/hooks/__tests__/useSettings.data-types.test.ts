/**
 * Tests for numeric and boolean settings
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings } from '../useSettings';
import { localStorageMock } from './test-utils';

describe('useSettings - Numeric Settings', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

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

    expect(result.current.settings.refreshInterval).toBe(
      Number.MAX_SAFE_INTEGER
    );
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
      result.current.updateSettings({
        maxConcurrentModels: Number.MAX_SAFE_INTEGER,
      });
    });

    expect(result.current.settings.maxConcurrentModels).toBe(
      Number.MAX_SAFE_INTEGER
    );
  });
});

describe('useSettings - Boolean Settings', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

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
