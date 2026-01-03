import { renderHook, act, waitFor } from "@testing-library/react";
import * as loggerHook from "@/hooks/use-logger-config";
import { useConfigurationForm } from "@/components/configuration/hooks/useConfigurationForm";

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
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // When load fails, formConfig remains in its initial state
    // with undefined values set by loadServerConfig
    expect(result.current.formConfig).toBeDefined();
  });

  it("should load config from API and populate formConfig", async () => {
    const mockConfig = {
      serverConfig: {
        host: "192.168.1.1",
        port: 9090,
        basePath: "/custom/server",
        serverPath: "/custom/path/server",
        ctx_size: 16384,
        batch_size: 1024,
        threads: 16,
        gpu_layers: 64,
      },
      appConfig: {
        basePath: "/custom",
        logLevel: "debug",
        maxConcurrentModels: 10,
        autoUpdate: true,
        notificationsEnabled: false,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    // Verify that config is loaded
    expect(result.current.formConfig).toBeDefined();
    // Verify serverConfig is populated
    expect(result.current.formConfig.serverConfig).toBeDefined();
    expect(result.current.formConfig.serverConfig?.host).toBe("192.168.1.1");
    expect(result.current.formConfig.serverConfig?.port).toBe(9090);
  });

  it("should load config with partial data", async () => {
    const mockPartialConfig = {
      serverConfig: {
        host: "127.0.0.1",
        port: 8080,
      },
      appConfig: {},
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPartialConfig,
    });

    const { result } = renderHook(() => useConfigurationForm());

    await waitFor(() => {
      expect(result.current.isLoadingConfig).toBe(false);
    });

    expect(result.current.formConfig).toBeDefined();
    expect(result.current.formConfig.serverConfig?.host).toBe("127.0.0.1");
    expect(result.current.formConfig.serverConfig?.port).toBe(8080);
  });
});
