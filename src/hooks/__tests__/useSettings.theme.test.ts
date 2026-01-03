/**
 * Tests for theme and log level settings
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings } from '../useSettings';
import { localStorageMock } from './test-utils';

describe('useSettings - Theme Settings', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

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

    expect(result.current.settings.theme).toBe('invalid' as any);
  });
});

describe('useSettings - Log Level Settings', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

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
