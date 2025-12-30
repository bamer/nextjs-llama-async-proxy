import { renderHook, act } from '@testing-library/react';
import { useConfigurationForm } from '@/components/configuration/hooks/useConfigurationForm';

jest.mock('@/hooks/use-logger-config', () => ({
  useLoggerConfig: jest.fn(() => ({
    applyToLogger: jest.fn(),
  })),
}));

const mockApplyToLogger = jest.fn();
const { useLoggerConfig } = require('@/hooks/use-logger-config');

const DEFAULT_SERVER_CONFIG = {
  host: '127.0.0.1',
  port: 8080,
  basePath: '/models',
  serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
  ctx_size: 8192,
  batch_size: 512,
  threads: -1,
  gpu_layers: -1,
};

describe('useConfigurationForm - Input Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(DEFAULT_SERVER_CONFIG),
      } as Response)
    ) as jest.Mock;

    useLoggerConfig.mockReturnValue({
      applyToLogger: mockApplyToLogger,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle text input change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'host', value: 'localhost', type: 'text', checked: false },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formConfig.llamaServer?.host).toBe('localhost');
  });

  it('should handle checkbox input change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'testCheckbox', value: 'on', type: 'checkbox', checked: true },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).testCheckbox).toBe(true);
  });

  it('should handle llama server input change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: 'localhost', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).llamaServer.host).toBe('localhost');
  });

  it('should handle llama server number input', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '8080', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).llamaServer.port).toBe(8080);
  });

  it('should handle model defaults change', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleModelDefaultsChange('temperature', 0.7);
    });

    expect((result.current.formConfig as any).modelDefaults.temperature).toBe(0.7);
  });

  it('should handle rapid tab changes', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 1);
    });

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 2);
    });

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 0);
    });

    expect(result.current.activeTab).toBe(0);
  });

  it('should handle multiple llama server field changes', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: 'localhost', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '3000', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.ctx_size', value: '4096', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).llamaServer.host).toBe('localhost');
    expect((result.current.formConfig as any).llamaServer.port).toBe(3000);
    expect((result.current.formConfig as any).llamaServer.ctx_size).toBe(4096);
  });

  it('should preserve existing llama server fields when updating one', () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.host', value: 'localhost', type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleLlamaServerChange({
        target: { name: 'llamaServer.port', value: '8080', type: 'number' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect((result.current.formConfig as any).llamaServer.host).toBe('localhost');
    expect((result.current.formConfig as any).llamaServer.port).toBe(8080);
  });
});
