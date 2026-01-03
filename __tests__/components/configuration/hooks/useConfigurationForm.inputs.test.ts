import { renderHook, act } from "@testing-library/react";
import * as loggerHook from "@/hooks/use-logger-config";
import { useConfigurationForm } from "@/components/configuration/hooks/useConfigurationForm";

jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(),
}));

describe("useConfigurationForm - Form Inputs & State", () => {
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

    expect(
      (result.current.formConfig as Record<string, unknown>).host,
    ).toBe("192.168.1.1");
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

    expect(
      (result.current.formConfig as Record<string, unknown>).autoUpdate,
    ).toBe(true);
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

    expect(
      (
        (result.current.formConfig as Record<string, unknown>)
          .llamaServer as Record<string, unknown>
      )?.port,
    ).toBe(9090);
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

    expect(
      (
        (result.current.formConfig as Record<string, unknown>)
          .modelDefaults as Record<string, unknown>
      )?.top_p,
    ).toBe(0.95);
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

    expect(
      (result.current.formConfig as Record<string, unknown>).autoUpdate,
    ).toBe(false);
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

    expect(
      (result.current.formConfig as Record<string, unknown>)
        .maxConcurrentModels,
    ).toBe(5);
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

    expect(
      (result.current.formConfig as Record<string, unknown>).basePath,
    ).toBe("/custom/path");
  });
});
