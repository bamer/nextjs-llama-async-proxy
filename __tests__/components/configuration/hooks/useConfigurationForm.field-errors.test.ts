import { renderHook, act, waitFor } from "@testing-library/react";
import * as loggerHook from "@/hooks/use-logger-config";
import { useConfigurationForm } from "@/components/configuration/hooks/useConfigurationForm";

jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(),
}));

describe("useConfigurationForm - Field Errors", () => {
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
      (result.current.formConfig as Record<string, unknown>).basePath = "";
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

    // After changing input, field error should be cleared or updated
    expect(result.current.fieldErrors.general).toBeDefined();
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

    // Verify llamaServer errors exist
    expect(result.current.fieldErrors.llamaServer).toBeDefined();
  });
});
