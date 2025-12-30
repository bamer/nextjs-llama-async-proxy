import { renderHook, act } from '@testing-library/react';
import { useSettings, AppSettings } from '@/hooks/useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe('system');
    expect(result.current.settings.logLevel).toBe('info');
    expect(result.current.settings.maxConcurrentModels).toBe(3);
    expect(result.current.settings.autoUpdate).toBe(true);
    expect(result.current.settings.notificationsEnabled).toBe(true);
    expect(result.current.settings.refreshInterval).toBe(2);
  });

  it('should initialize with loading set to false', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.isLoading).toBe(false);
  });

  it('should provide updateSettings function', () => {
    const { result } = renderHook(() => useSettings());

    expect(typeof result.current.updateSettings).toBe('function');
  });

  it('should update single setting', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });

    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.logLevel).toBe('info');
    expect(result.current.settings.maxConcurrentModels).toBe(3);
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
    expect(result.current.settings.maxConcurrentModels).toBe(3);
  });

  it('should handle all theme values', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: 'light' });
    });
    expect(result.current.settings.theme).toBe('light');

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });
    expect(result.current.settings.theme).toBe('dark');

    act(() => {
      result.current.updateSettings({ theme: 'system' });
    });
    expect(result.current.settings.theme).toBe('system');
  });

  it('should handle all logLevel values', () => {
    const { result } = renderHook(() => useSettings());

    const logLevels = ['debug', 'info', 'warn', 'error'] as const;

    logLevels.forEach((level) => {
      act(() => {
        result.current.updateSettings({ logLevel: level });
      });
      expect(result.current.settings.logLevel).toBe(level);
    });
  });

  it('should handle maxConcurrentModels updates', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ maxConcurrentModels: 1 });
    });
    expect(result.current.settings.maxConcurrentModels).toBe(1);

    act(() => {
      result.current.updateSettings({ maxConcurrentModels: 10 });
    });
    expect(result.current.settings.maxConcurrentModels).toBe(10);
  });

  it('should handle boolean setting updates', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ autoUpdate: false });
    });
    expect(result.current.settings.autoUpdate).toBe(false);

    act(() => {
      result.current.updateSettings({ notificationsEnabled: false });
    });
    expect(result.current.settings.notificationsEnabled).toBe(false);

    act(() => {
      result.current.updateSettings({ autoUpdate: true, notificationsEnabled: true });
    });
    expect(result.current.settings.autoUpdate).toBe(true);
    expect(result.current.settings.notificationsEnabled).toBe(true);
  });

  it('should handle refreshInterval updates', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ refreshInterval: 1 });
    });
    expect(result.current.settings.refreshInterval).toBe(1);

    act(() => {
      result.current.updateSettings({ refreshInterval: 60 });
    });
    expect(result.current.settings.refreshInterval).toBe(60);
  });

  it('should handle empty update object', () => {
    const { result } = renderHook(() => useSettings());

    const initialSettings = { ...result.current.settings };

    act(() => {
      result.current.updateSettings({});
    });

    expect(result.current.settings).toEqual(initialSettings);
  });

  it('should maintain settings type safety', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toMatchObject<AppSettings>({
      theme: expect.any(String),
      logLevel: expect.any(String),
      maxConcurrentModels: expect.any(Number),
      autoUpdate: expect.any(Boolean),
      notificationsEnabled: expect.any(Boolean),
      refreshInterval: expect.any(Number),
    });
  });

  it('should handle rapid settings updates', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });

    act(() => {
      result.current.updateSettings({ logLevel: 'debug' });
    });

    act(() => {
      result.current.updateSettings({ refreshInterval: 5 });
    });

    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.logLevel).toBe('debug');
    expect(result.current.settings.refreshInterval).toBe(5);
  });

  it('should return consistent settings object', () => {
    const { result } = renderHook(() => useSettings());

    const settings1 = result.current.settings;
    const settings2 = result.current.settings;

    expect(settings1).toBe(settings2);
  });

  it('should handle all settings types correctly', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({
        theme: 'dark',
        logLevel: 'warn',
        maxConcurrentModels: 7,
        autoUpdate: false,
        notificationsEnabled: false,
        refreshInterval: 30,
      });
    });

    expect(result.current.settings).toEqual({
      theme: 'dark',
      logLevel: 'warn',
      maxConcurrentModels: 7,
      autoUpdate: false,
      notificationsEnabled: false,
      refreshInterval: 30,
    });
  });

  it('should preserve default values for unmodified settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });

    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.logLevel).toBe('info');
    expect(result.current.settings.maxConcurrentModels).toBe(3);
    expect(result.current.settings.autoUpdate).toBe(true);
    expect(result.current.settings.notificationsEnabled).toBe(true);
    expect(result.current.settings.refreshInterval).toBe(2);
  });

  it('should work correctly with multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useSettings());
    const { result: result2 } = renderHook(() => useSettings());

    act(() => {
      result1.current.updateSettings({ theme: 'dark' });
    });

    // Each instance should be independent
    expect(result1.current.settings.theme).toBe('dark');
    expect(result2.current.settings.theme).toBe('system'); // Still default
  });

  it('should handle settings across re-renders', () => {
    const { result, rerender } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });

    rerender();

    expect(result.current.settings.theme).toBe('dark');
  });

  it('should maintain loading state as false', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });

    expect(result.current.isLoading).toBe(false);
  });
});
