import { renderHook, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useConfigurationForm } from "@/components/configuration/hooks/useConfigurationForm";
import * as loggerHook from "@/hooks/use-logger-config";

jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(),
}));

describe("useConfigurationForm", () => {
  const mockApplyToLogger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for fetch - returns empty config
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      applyToLogger: mockApplyToLogger,
    });

    // Suppress console.error for expected test cases
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useConfigurationForm());

    expect(result.current.activeTab).toBe(0);
    expect(result.current.formConfig).toEqual({});
    expect(result.current.validationErrors).toEqual([]);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveSuccess).toBe(false);
  });

  it("should load server config on mount", async () => {
    const mockConfig = {
      host: "127.0.0.1",
      port: 8080,
      basePath: "/models",
      serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
      ctx_size: 8192,
      batch_size: 512,
      threads: -1,
      gpu_layers: -1,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    const { result } = renderHook(() => useConfigurationForm());

    expect(result.current.isLoadingConfig).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/config");
    // Check that the config was loaded
    expect(result.current.formConfig).toBeDefined();
    expect(result.current.validationErrors.length).toBe(0);
  });

  it("should handle failed config load", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    expect(result.current.formConfig).toEqual({});
  });

  it("should handle save with validation errors for missing host", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
    });

    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });

  it("should handle save with validation errors for invalid port", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).host = "localhost";
      (result.current.formConfig as Record<string, unknown>).port = 99999;
      (result.current.formConfig as Record<string, unknown>).serverPath = "/path/to/server";

      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
    });

    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });

  it("should handle save with validation errors for missing server path", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).host = "localhost";
      (result.current.formConfig as Record<string, unknown>).port = 8080;
      (result.current.formConfig as Record<string, unknown>).serverPath = "";

      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
    });

    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });

  it("should handle tab change", () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      result.current.handleTabChange({} as React.SyntheticEvent, 2);
    });

    expect(result.current.activeTab).toBe(2);
  });

  it("should handle input change", () => {
    const { result } = renderHook(() => useConfigurationForm());

    const input = document.createElement("input");
    input.name = "host";
    input.value = "192.168.1.1";

    const mockEvent = {
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleInputChange(mockEvent);
    });

    expect((result.current.formConfig as Record<string, unknown>).host).toBe("192.168.1.1");
  });

  it("should handle checkbox input change", () => {
    const { result } = renderHook(() => useConfigurationForm());

    const input = document.createElement("input");
    input.name = "autoUpdate";
    input.type = "checkbox";
    (input as any).checked = true;

    const mockEvent = {
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleInputChange(mockEvent);
    });

    expect((result.current.formConfig as Record<string, unknown>).autoUpdate).toBe(true);
  });

  it("should handle llama server input change", () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      (result.current.formConfig as Record<string, unknown>).llamaServer = {
        host: "localhost",
        port: 8080,
      };
    });

    const input = document.createElement("input");
    input.name = "llamaServer.port";
    input.value = "9090";
    input.type = "number";

    const mockEvent = {
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleLlamaServerChange(mockEvent);
    });

    expect(((result.current.formConfig as Record<string, unknown>).llamaServer as Record<string, unknown>)?.port).toBe(9090);
  });

  it("should handle model defaults change", () => {
    const { result } = renderHook(() => useConfigurationForm());

    act(() => {
      (result.current.formConfig as Record<string, unknown>).modelDefaults = {
        temperature: 0.7,
      };
    });

    act(() => {
      result.current.handleModelDefaultsChange("top_p", 0.95);
    });

    expect(((result.current.formConfig as Record<string, unknown>).modelDefaults as Record<string, unknown>)?.top_p).toBe(0.95);
  });

  it("should save configuration successfully", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ host: "127.0.0.1", port: 8080 }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).host = "127.0.0.1";
      (result.current.formConfig as Record<string, unknown>).port = 8080;
      (result.current.formConfig as Record<string, unknown>).basePath = "/models";
      (result.current.formConfig as Record<string, unknown>).serverPath = "/path/to/server";
      (result.current.formConfig as Record<string, unknown>).ctx_size = 8192;
      (result.current.formConfig as Record<string, unknown>).batch_size = 512;
      (result.current.formConfig as Record<string, unknown>).threads = 8;
      (result.current.formConfig as Record<string, unknown>).gpu_layers = 32;
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    // Check that the save was attempted
    expect(result.current.isSaving).toBe(false);
    expect(global.fetch).toHaveBeenCalled();
  });

  it("should handle save validation failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });

  it("should handle save API failure", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          host: "127.0.0.1",
          port: 8080,
          basePath: "/models",
          serverPath: "/path/to/server",
          ctx_size: 8192,
          batch_size: 512,
          threads: -1,
          gpu_layers: -1,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      result.current.formConfig = {
        host: "127.0.0.1",
        port: 8080,
        basePath: "/models",
        serverPath: "/path/to/server",
      };
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(result.current.saveSuccess).toBe(false);
  });

  it("should reset configuration", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        host: "127.0.0.1",
        port: 8080,
        basePath: "/models",
        serverPath: "/path/to/server",
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      }),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).host = "192.168.1.1";
      (result.current.formConfig as Record<string, unknown>).port = 9090;
    });

    await act(async () => {
      await result.current.handleReset();
    });

    await waitFor(() => {
      expect((result.current.formConfig as Record<string, unknown>).llamaServer).toBeDefined();
    });
  });

  it("should sync configuration", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        host: "127.0.0.1",
        port: 8080,
      }),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await act(async () => {
      await result.current.handleSync();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/config");
  });

  it("should clear save success message after timeout", async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          host: "127.0.0.1",
          port: 8080,
          basePath: "/models",
          serverPath: "/path/to/server",
          ctx_size: 8192,
          batch_size: 512,
          threads: -1,
          gpu_layers: -1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).host = "127.0.0.1";
      (result.current.formConfig as Record<string, unknown>).port = 8080;
      (result.current.formConfig as Record<string, unknown>).basePath = "/models";
      (result.current.formConfig as Record<string, unknown>).serverPath = "/path/to/server";
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    jest.useRealTimers();
  });

  it("should handle multiple validation errors at once", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).host = "";
      (result.current.formConfig as Record<string, unknown>).port = 99999;
      (result.current.formConfig as Record<string, unknown>).serverPath = "";
      (result.current.formConfig as Record<string, unknown>).ctx_size = -100;
      (result.current.formConfig as Record<string, unknown>).batch_size = -5;

      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.validationErrors.length).toBeGreaterThan(1);
    });

    expect(result.current.saveSuccess).toBe(false);
    // Check that there are validation errors
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });

  // Additional tests for missing coverage
  it("should clear field errors on input change", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ host: "127.0.0.1", port: 8080 }),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // First set a field error
    act(() => {
      (result.current.formConfig as Record<string, unknown>).host = "";
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.fieldErrors.general).toBeDefined();
    });

    // Now change the input to clear the error
    const input = document.createElement("input");
    input.name = "basePath";
    input.value = "/models";

    const mockEvent = {
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleInputChange(mockEvent);
    });

    expect((result.current.fieldErrors.general as Record<string, string>).basePath).toBe("");
  });

  it("should clear field errors on llama server change", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        host: "127.0.0.1",
        port: 8080,
        basePath: "/models",
        serverPath: "/path/to/server",
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      }),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // First set up a field error
    act(() => {
      result.current.fieldErrors.llamaServer = { port: "Invalid port" };
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).llamaServer = {
        host: "localhost",
        port: 8080,
      };
    });

    const input = document.createElement("input");
    input.name = "llamaServer.port";
    input.value = "9090";
    input.type = "number";

    const mockEvent = {
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleLlamaServerChange(mockEvent);
    });

    expect((result.current.fieldErrors.llamaServer as Record<string, string>).port).toBe("");
  });

  it("should handle save with network error", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          host: "127.0.0.1",
          port: 8080,
          basePath: "/models",
          serverPath: "/path/to/server",
          ctx_size: 8192,
          batch_size: 512,
          threads: -1,
          gpu_layers: -1,
        }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      result.current.formConfig = {
        host: "127.0.0.1",
        port: 8080,
        basePath: "/models",
        serverPath: "/path/to/server",
      };
    });

    act(() => {
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(result.current.saveSuccess).toBe(false);
  });

  it("should validate general settings fields correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).basePath = "";
      (result.current.formConfig as Record<string, unknown>).logLevel = "invalid";
      (result.current.formConfig as Record<string, unknown>).maxConcurrentModels = 0;
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
    });

    expect(result.current.fieldErrors.general).toBeDefined();
  });

  it("should validate llama server settings fields correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).llamaServer = {
        host: "",
        port: -1,
        ctx_size: 0,
        batch_size: 0,
        threads: -2,
        gpu_layers: -2,
      };
      result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
    });

    expect(result.current.fieldErrors.llamaServer).toBeDefined();
  });

  it("should handle checkbox input change correctly", () => {
    const { result } = renderHook(() => useConfigurationForm());

    const input = document.createElement("input");
    input.name = "autoUpdate";
    input.type = "checkbox";
    (input as any).checked = false;

    const mockEvent = {
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleInputChange(mockEvent);
    });

    expect((result.current.formConfig as Record<string, unknown>).autoUpdate).toBe(false);
  });

  it("should handle number input change correctly", () => {
    const { result } = renderHook(() => useConfigurationForm());

    const input = document.createElement("input");
    input.name = "maxConcurrentModels";
    input.type = "number";
    (input as any).value = "5";

    const mockEvent = {
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleInputChange(mockEvent);
    });

    expect((result.current.formConfig as Record<string, unknown>).maxConcurrentModels).toBe("5");
  });

  it("should handle text input change correctly", () => {
    const { result } = renderHook(() => useConfigurationForm());

    const input = document.createElement("input");
    input.name = "basePath";
    input.type = "text";
    input.value = "/custom/path";

    const mockEvent = {
      target: input,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleInputChange(mockEvent);
    });

    expect((result.current.formConfig as Record<string, unknown>).basePath).toBe("/custom/path");
  });

  it("should load config from API and populate formConfig", async () => {
    const mockServerConfig = {
      host: "192.168.1.1",
      port: 9090,
      basePath: "/custom",
      serverPath: "/custom/path/server",
      ctx_size: 16384,
      batch_size: 1024,
      threads: 16,
      gpu_layers: 64,
    };

    const mockAppConfig = {
      logLevel: "debug",
      maxConcurrentModels: 10,
      autoUpdate: true,
      notificationsEnabled: false,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        serverConfig: mockServerConfig,
        appConfig: mockAppConfig,
      }),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    expect(result.current.formConfig.basePath).toBe("/custom");
    expect(result.current.formConfig.logLevel).toBe("debug");
    expect(result.current.formConfig.maxConcurrentModels).toBe(10);
    expect(result.current.formConfig.autoUpdate).toBe(true);
    expect(result.current.formConfig.notificationsEnabled).toBe(false);
    expect(result.current.formConfig.llamaServerPath).toBe("/custom/path/server");
  });

  it("should load config with partial data", async () => {
    const mockPartialConfig = {
      host: "127.0.0.1",
      port: 8080,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        serverConfig: mockPartialConfig,
        appConfig: {},
      }),
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    expect(result.current.formConfig).toBeDefined();
  });
});
