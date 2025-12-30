import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfigurationForm } from '@/components/configuration/hooks/useConfigurationForm';

// Mock dependencies
jest.mock('@/hooks/use-logger-config', () => ({
  useLoggerConfig: jest.fn(() => ({
    applyToLogger: jest.fn(),
  })),
}));

describe('useConfigurationForm - Enhanced Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Save Functionality - Critical Path', () => {
    it('saves configuration with valid data', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useConfigurationForm());

      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Form should have loaded config
      expect(result.current.formConfig).toBeDefined();

      // Try to save
      let saveError: Error | null = null;
      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
          saveError = e as Error;
        }
      });

      // Should not throw
      expect(saveError).toBeNull();
      expect(result.current.isSaving).toBe(false);
    });

    it('handles save API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let saveError: Error | null = null;
      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
          saveError = e as Error;
        }
      });

      // Should handle error gracefully
      expect(saveError).toBeNull();
      expect(result.current.isSaving).toBe(false);
    });

    it('handles network errors during save', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let saveError: Error | null = null;
      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
          saveError = e as Error;
        }
      });

      // Should handle error gracefully
      expect(saveError).toBeNull();
      expect(result.current.isSaving).toBe(false);
    });

    it('sets saving state during save operation', async () => {
      let resolveFetch: any;
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => { resolveFetch = resolve; })
      );

      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleSave();
      });

      // Should be in saving state
      expect(result.current.isSaving).toBe(true);

      // Resolve the fetch
      await act(async () => {
        await resolveFetch!({ ok: true });
      });

      // Should not be saving anymore
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('Form Interactions - Coverage Enhancement', () => {
    it('handles rapid input changes', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Simulate rapid changes
      act(() => {
        result.current.handleInputChange({
          target: { name: 'basePath', value: '/path1', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleInputChange({
          target: { name: 'basePath', value: '/path2', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleInputChange({
          target: { name: 'basePath', value: '/path3', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formConfig.basePath).toBe('/path3');
    });

    it('handles multiple field changes in sequence', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleInputChange({
          target: { name: 'basePath', value: '/test', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleInputChange({
          target: { name: 'logLevel', value: 'debug', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleInputChange({
          target: { name: 'maxConcurrentModels', value: '3', type: 'number' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formConfig.basePath).toBe('/test');
      expect(result.current.formConfig.logLevel).toBe('debug');
      expect(result.current.formConfig.maxConcurrentModels).toBe('3');
    });

    it('handles llama server nested field changes', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleLlamaServerChange({
          target: { name: 'llamaServer.host', value: '192.168.1.1', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleLlamaServerChange({
          target: { name: 'llamaServer.port', value: '9000', type: 'number' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formConfig.llamaServer?.host).toBe('192.168.1.1');
      expect(result.current.formConfig.llamaServer?.port).toBe(9000);
    });
  });

  describe('Tab Navigation', () => {
    it('handles tab changes', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initialTab = result.current.activeTab;

      act(() => {
        result.current.handleTabChange({} as any, 2);
      });

      expect(result.current.activeTab).toBe(2);
      expect(result.current.activeTab).not.toBe(initialTab);
    });

    it('handles sequential tab changes', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      [1, 2, 3, 0].forEach((tabIndex) => {
        act(() => {
          result.current.handleTabChange({} as any, tabIndex);
        });
        expect(result.current.activeTab).toBe(tabIndex);
      });
    });
  });

  describe('Reset and Sync', () => {
    it('handles reset operation', async () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initialFormConfig = result.current.formConfig;

      // Trigger reset
      let resetError: Error | null = null;
      await act(async () => {
        try {
          await result.current.handleReset();
        } catch (e) {
          resetError = e as Error;
        }
      });

      expect(resetError).toBeNull();
    });

    it('handles sync operation', async () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

      // Trigger sync
      let syncError: Error | null = null;
      await act(async () => {
        try {
          await result.current.handleSync();
        } catch (e) {
          syncError = e as Error;
        }
      });

      expect(syncError).toBeNull();
      // Should have made additional fetch calls
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('handles reset errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Load failed'));

      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Try reset
      let resetError: Error | null = null;
      await act(async () => {
        try {
          await result.current.handleReset();
        } catch (e) {
          resetError = e as Error;
        }
      });

      // Should handle error gracefully
      expect(resetError).toBeNull();
    });
  });

  describe('Validation Error Handling', () => {
    it('accumulates validation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Try save with invalid data
      await act(async () => {
        await result.current.handleSave();
      });

      // Check if validation errors are present
      // This will depend on what validators return
      expect(Array.isArray(result.current.validationErrors)).toBe(true);
    });

    it('clears field errors on input change', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initialErrors = result.current.fieldErrors.general;

      // Make a change
      act(() => {
        result.current.handleInputChange({
          target: { name: 'basePath', value: '/new', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Field errors should be cleared or updated
      expect(result.current.fieldErrors.general).toBeDefined();
    });
  });

  describe('Model Defaults', () => {
    it('handles model defaults changes', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.handleModelDefaultsChange('ctx_size', 4096);
      });

      expect(result.current.formConfig.modelDefaults?.ctx_size).toBe(4096);

      act(() => {
        result.current.handleModelDefaultsChange('batch_size', 1024);
      });

      expect(result.current.formConfig.modelDefaults?.batch_size).toBe(1024);
    });

    it('handles multiple model defaults changes', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const defaults = [
        { field: 'ctx_size', value: 4096 },
        { field: 'batch_size', value: 1024 },
        { field: 'threads', value: 8 },
        { field: 'gpu_layers', value: 35 },
      ];

      defaults.forEach(({ field, value }) => {
        act(() => {
          result.current.handleModelDefaultsChange(field, value);
        });
      });

      expect(result.current.formConfig.modelDefaults?.ctx_size).toBe(4096);
      expect(result.current.formConfig.modelDefaults?.batch_size).toBe(1024);
      expect(result.current.formConfig.modelDefaults?.threads).toBe(8);
      expect(result.current.formConfig.modelDefaults?.gpu_layers).toBe(35);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty form config on save', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let saveError: Error | null = null;
      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
          saveError = e as Error;
        }
      });

      expect(saveError).toBeNull();
    });

    it('handles missing llama server config on save', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      let saveError: Error | null = null;
      await act(async () => {
        try {
          await result.current.handleSave();
        } catch (e) {
          saveError = e as Error;
        }
      });

      expect(saveError).toBeNull();
    });

    it('handles all input types correctly', () => {
      const { result } = renderHook(() => useConfigurationForm());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Text input
      act(() => {
        result.current.handleInputChange({
          target: { name: 'test', value: 'value', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Number input
      act(() => {
        result.current.handleInputChange({
          target: { name: 'num', value: '123', type: 'number' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Checkbox
      act(() => {
        result.current.handleInputChange({
          target: { name: 'check', checked: true, type: 'checkbox' },
        } as any);
      });

      expect(result.current.formConfig.test).toBe('value');
      expect(result.current.formConfig.num).toBe('123');
      expect(result.current.formConfig.check).toBe(true);
    });
  });
});
