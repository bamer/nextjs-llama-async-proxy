import { renderHook, act, waitFor } from "@testing-library/react";
import * as loggerHook from "@/hooks/use-logger-config";
import { useConfigurationForm } from "@/components/configuration/hooks/useConfigurationForm";

jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(),
}));

describe("useConfigurationForm - Save Operations", () => {
  const mockApplyToLogger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      applyToLogger: mockApplyToLogger,
    });

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
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
      (result.current.formConfig as Record<string, unknown>).serverPath =
        "/path/to/server";
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
      (result.current.formConfig as Record<string, unknown>) = {
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
      (result.current.formConfig as Record<string, unknown>) = {
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

});
