import { renderHook, act, waitFor } from "@testing-library/react";
import * as loggerHook from "@/hooks/use-logger-config";
import { useConfigurationForm } from "@/components/configuration/hooks/useConfigurationForm";

jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(),
}));

describe("useConfigurationForm - Validation", () => {
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
      (result.current.formConfig as Record<string, unknown>).serverPath =
        "/path/to/server";

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
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
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
      (result.current.formConfig as Record<string, unknown>).logLevel =
        "invalid";
      (result.current.formConfig as Record<string, unknown>).maxConcurrentModels =
        0;
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
});
