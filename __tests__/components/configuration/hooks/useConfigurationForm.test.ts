import { renderHook, act } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import { useConfigurationForm } from '@/components/configuration/hooks/useConfigurationForm';

interface LlamaServerConfig {
  host: string;
  port: number;
  basePath: string;
  serverPath: string;
  ctx_size: number;
  batch_size: number;
  threads: number;
  gpu_layers: number;
}

const defaultConfig: Partial<LlamaServerConfig> = {
  host: '127.0.0.1',
  port: 8080,
  basePath: '/models',
  serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
  ctx_size: 8192,
  batch_size: 512,
  threads: -1,
  gpu_layers: -1,
};

describe('useConfigurationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty formConfig', () => {
      const { result } = renderHook(() => useConfigurationForm());

      expect(result.current.formConfig).toEqual({});
    });

    it('should load server config on mount', async () => {
      const mockServerConfig = {
        host: 'test-host',
        port: 9000,
        basePath: '/test/path',
        serverPath: '/test/server',
        ctx_size: 16384,
        batch_size: 1024,
        threads: 4,
        gpu_layers: 35,
      };
      fetchMock.mockResponseOnce(JSON.stringify(mockServerConfig));

      const { result, waitForNextUpdate } = renderHook(() => useConfigurationForm());

      await waitForNextUpdate();

      expect(result.current.formConfig).toEqual(mockServerConfig);
      expect(fetchMock).toHaveBeenCalledWith('/api/config');
    });

    it('should set loading state during config load', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(defaultConfig), { delay: 100 });

      const { result } = renderHook(() => useConfigurationForm());

      expect(result.current.isLoadingConfig).toBe(true);
    });
  });

  describe('handleTabChange', () => {
    it('should update activeTab value', () => {
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleTabChange({} as React.SyntheticEvent, 1);
      });

      expect(result.current.activeTab).toBe(1);
    });

    it('should support multiple tab changes', () => {
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleTabChange({} as React.SyntheticEvent, 2);
      });

      expect(result.current.activeTab).toBe(2);

      act(() => {
        result.current.handleTabChange({} as React.SyntheticEvent, 0);
      });

      expect(result.current.activeTab).toBe(0);
    });
  });

  describe('handleInputChange', () => {
    it('should update formConfig with text input', () => {
      const { result } = renderHook(() => useConfigurationForm());
      const event = {
        target: {
          name: 'host',
          value: 'new-host',
          type: 'text',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleInputChange(event);
      });

      expect(result.current.formConfig.host).toBe('new-host');
    });

    it('should update formConfig with number input', () => {
      const { result } = renderHook(() => useConfigurationForm());
      const event = {
        target: {
          name: 'port',
          value: '9000',
          type: 'number',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleInputChange(event);
      });

      expect(result.current.formConfig.port).toBe('9000');
    });

    it('should update formConfig with checkbox input', () => {
      const { result } = renderHook(() => useConfigurationForm());
      const event = {
        target: {
          name: 'enabled',
          value: 'on',
          type: 'checkbox',
          checked: true,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleInputChange(event);
      });

      expect(result.current.formConfig.enabled).toBe(true);
    });

    it('should preserve other formConfig values on update', () => {
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleInputChange({
          target: { name: 'host', value: 'host1', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleInputChange({
          target: { name: 'port', value: '9000', type: 'number' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formConfig.host).toBe('host1');
      expect(result.current.formConfig.port).toBe('9000');
    });
  });

  describe('handleLlamaServerChange', () => {
    it('should update nested llamaServer config', () => {
      const { result } = renderHook(() => useConfigurationForm());
      const event = {
        target: {
          name: 'llamaServer.host',
          value: 'llama-host',
          type: 'text',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLlamaServerChange(event);
      });

      expect(result.current.formConfig.llamaServer).toEqual({
        host: 'llama-host',
      });
    });

    it('should handle number fields in nested config', () => {
      const { result } = renderHook(() => useConfigurationForm());
      const event = {
        target: {
          name: 'llamaServer.port',
          value: '9999',
          type: 'number',
        },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLlamaServerChange(event);
      });

      expect(result.current.formConfig.llamaServer?.port).toBe(9999);
    });

    it('should preserve existing nested config values', () => {
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleLlamaServerChange({
          target: { name: 'llamaServer.host', value: 'host1', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleLlamaServerChange({
          target: { name: 'llamaServer.port', value: '9000', type: 'number' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formConfig.llamaServer?.host).toBe('host1');
      expect(result.current.formConfig.llamaServer?.port).toBe(9000);
    });
  });

  describe('handleModelDefaultsChange', () => {
    it('should update modelDefaults config', () => {
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleModelDefaultsChange('ctx_size', 16384);
      });

      expect(result.current.formConfig.modelDefaults).toEqual({
        ctx_size: 16384,
      });
    });

    it('should update multiple model defaults', () => {
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleModelDefaultsChange('ctx_size', 16384);
      });

      act(() => {
        result.current.handleModelDefaultsChange('batch_size', 1024);
      });

      expect(result.current.formConfig.modelDefaults).toEqual({
        ctx_size: 16384,
        batch_size: 1024,
      });
    });

    it('should preserve existing model defaults', () => {
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleModelDefaultsChange('ctx_size', 16384);
      });

      act(() => {
        result.current.handleModelDefaultsChange('batch_size', 1024);
      });

      act(() => {
        result.current.handleModelDefaultsChange('threads', 4);
      });

      expect(result.current.formConfig.modelDefaults?.ctx_size).toBe(16384);
      expect(result.current.formConfig.modelDefaults?.batch_size).toBe(1024);
      expect(result.current.formConfig.modelDefaults?.threads).toBe(4);
    });
  });

  describe('handleSave', () => {
    it('should save config via POST request', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ message: 'OK' }));
      const { result } = renderHook(() => useConfigurationForm());
      act(() => {
        result.current.handleInputChange({
          target: { name: 'host', value: 'test-host', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/config',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should set isSaving state during save', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ message: 'OK' }), { delay: 100 });
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleSave();
      });

      expect(result.current.isSaving).toBe(true);
    });

    it('should set saveSuccess to true on successful save', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ message: 'OK' }));
      const { result } = renderHook(() => useConfigurationForm());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.saveSuccess).toBe(true);
    });

    it('should clear saveSuccess after 3 seconds', async () => {
      jest.useFakeTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ message: 'OK' }));
      const { result } = renderHook(() => useConfigurationForm());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.saveSuccess).toBe(true);

      act(() => {
        jest.advanceTimersByTime(3001);
      });

      expect(result.current.saveSuccess).toBe(false);
      jest.useRealTimers();
    });

    it('should set validationErrors for invalid config', async () => {
      const { result } = renderHook(() => useConfigurationForm());
      act(() => {
        result.current.handleInputChange({
          target: { name: 'port', value: 'invalid', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
        }
      });

      expect(result.current.validationErrors.length).toBeGreaterThan(0);
    });

    it('should handle save errors gracefully', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useConfigurationForm());

      await act(async () => {
        await result.current.handleSave();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.current.isSaving).toBe(false);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleReset', () => {
    it('should reset formConfig to empty', () => {
      const { result } = renderHook(() => useConfigurationForm());
      act(() => {
        result.current.handleInputChange({
          target: { name: 'host', value: 'test', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formConfig.host).toBe('test');

      act(() => {
        result.current.handleReset();
      });

      expect(result.current.formConfig).toEqual({});
    });

    it('should reload server config after reset', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(defaultConfig));
      fetchMock.mockResponseOnce(JSON.stringify(defaultConfig));
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleInputChange({
          target: { name: 'host', value: 'modified', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleReset();
      });

      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('handleSync', () => {
    it('should reload server config', async () => {
      const mockConfig = {
        host: 'sync-host',
        port: 8888,
      };
      fetchMock.mockResponseOnce(JSON.stringify(mockConfig));
      const { result } = renderHook(() => useConfigurationForm());

      await act(async () => {
        await result.current.handleSync();
      });

      expect(result.current.formConfig).toEqual(mockConfig);
      expect(fetchMock).toHaveBeenCalledWith('/api/config');
    });
  });

  describe('validation', () => {
    it('should validate required host field', async () => {
      const { result } = renderHook(() => useConfigurationForm());
      act(() => {
        result.current.handleInputChange({
          target: { name: 'host', value: '', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
        }
      });

      expect(result.current.validationErrors.some((e: string) => e.includes('Host'))).toBe(true);
    });

    it('should validate port range', async () => {
      const { result } = renderHook(() => useConfigurationForm());
      act(() => {
        result.current.handleInputChange({
          target: { name: 'port', value: '99999', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
        }
      });

      expect(result.current.validationErrors.some((e: string) => e.includes('port'))).toBe(true);
    });

    it('should validate required serverPath field', async () => {
      const { result } = renderHook(() => useConfigurationForm());
      act(() => {
        result.current.handleInputChange({
          target: { name: 'serverPath', value: '', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
        }
      });

      expect(result.current.validationErrors.some((e: string) => e.includes('Server path'))).toBe(true);
    });
  });

  describe('TypeScript type safety', () => {
    it('should maintain type safety for returned values', () => {
      const { result } = renderHook(() => useConfigurationForm());

      expect(typeof result.current.activeTab).toBe('number');
      expect(typeof result.current.isSaving).toBe('boolean');
      expect(typeof result.current.saveSuccess).toBe('boolean');
      expect(typeof result.current.isLoadingConfig).toBe('boolean');
      expect(Array.isArray(result.current.validationErrors)).toBe(true);
      expect(typeof result.current.formConfig).toBe('object');
    });

    it('should type formConfig values correctly', () => {
      const { result } = renderHook(() => useConfigurationForm());

      act(() => {
        result.current.handleInputChange({
          target: { name: 'port', value: '8080', type: 'number' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(typeof result.current.formConfig.port).toBe('string');
    });
  });
});
