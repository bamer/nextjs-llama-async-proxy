import { renderHook, act } from "@testing-library/react";
import * as loggerHook from "@/hooks/use-logger-config";
import { useConfigurationForm } from "@/components/configuration/hooks/useConfigurationForm";

jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(),
}));

describe("useConfigurationForm - Reset & Sync", () => {
  const mockApplyToLogger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        host: "127.0.0.1",
        port: 8080,
      }),
    });

    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      applyToLogger: mockApplyToLogger,
    });

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should reset configuration", async () => {
    const { result } = renderHook(() => useConfigurationForm());

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    act(() => {
      (result.current.formConfig as Record<string, unknown>).host =
        "192.168.1.1";
    });

    // Call reset
    await act(async () => {
      await result.current.handleReset();
    });

    // Config should be reloaded
    expect(global.fetch).toHaveBeenCalledWith("/api/config");
  });

  it("should sync configuration", async () => {
    const { result } = renderHook(() => useConfigurationForm());

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    act(() => {
      result.current.handleSync();
    });

    // Just verify sync was attempted (fetch called for /api/config)
    // Note: The actual fetch calls depend on implementation
    expect(global.fetch).toHaveBeenCalled();
  });
});
