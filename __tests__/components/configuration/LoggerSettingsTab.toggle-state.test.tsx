import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { LoggerSettingsTab } from "@/components/configuration/LoggerSettingsTab";
import * as loggerHook from "@/hooks/use-logger-config";
import {
  mockUpdateConfig,
  mockClearFieldError,
  defaultLoggerConfig,
  setupMocks,
  renderComponent,
} from "./LoggerSettingsTab.test.helpers";

jest.mock("framer-motion", () => ({
  m: {
    div: (props: unknown) => {
      const { children } = props as { children?: React.ReactNode };
      return <div>{children}</div>;
    },
  },
}));

jest.mock("@/hooks/use-logger-config", () => ({
  useLoggerConfig: jest.fn(),
}));

describe("LoggerSettingsTab - Toggle States", () => {
  beforeEach(() => {
    setupMocks();
  });

  it("calls updateConfig when Console Logging switch is toggled", () => {
    renderComponent(<LoggerSettingsTab />);
    const checkbox = screen.getByRole("switch", {
      name: /enable console logging/i,
    });
    fireEvent.click(checkbox);
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableConsoleLogging: false });
  });

  it("calls updateConfig when File Logging switch is toggled", () => {
    renderComponent(<LoggerSettingsTab />);
    const checkbox = screen.getByRole("switch", {
      name: /enable file logging/i,
    });
    fireEvent.click(checkbox);
    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });
  });

  it("toggles Console Logging switch exists", () => {
    renderComponent(<LoggerSettingsTab />);

    const switchElement = screen.getByRole("switch", {
      name: /enable console logging/i,
    });
    expect(switchElement).toBeInTheDocument();
  });

  it("toggles File Logging switch exists", () => {
    renderComponent(<LoggerSettingsTab />);

    const switchElement = screen.getByRole("switch", {
      name: /enable file logging/i,
    });
    expect(switchElement).toBeInTheDocument();
  });

  it("handles disabled Console Logging state correctly", () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole("switch", {
      name: /enable console logging/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("handles disabled File Logging state correctly", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole("switch", {
      name: /enable file logging/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("handles enabled Console Logging state correctly", () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole("switch", {
      name: /enable console logging/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("handles enabled File Logging state correctly", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole("switch", {
      name: /enable file logging/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("handles undefined loggerConfig with fallbacks", () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: undefined,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox1 = screen.getByRole("switch", {
      name: /enable console logging/i,
    }) as HTMLInputElement;
    const checkbox2 = screen.getByRole("switch", {
      name: /enable file logging/i,
    }) as HTMLInputElement;

    expect(checkbox1.checked).toBe(true);
    expect(checkbox2.checked).toBe(true);
  });

  it("does not crash with null loggerConfig", () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    expect(() => {
      renderComponent(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it("does not crash with undefined loggerConfig", () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: undefined,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    expect(() => {
      renderComponent(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it("handles loading state correctly", () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
      clearFieldError: mockClearFieldError,
    });
    expect(() => {
      renderComponent(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it("handles custom configuration values", () => {
    const customConfig = {
      enableConsoleLogging: false,
      consoleLevel: "debug",
      enableFileLogging: false,
      fileLevel: "debug",
      errorLevel: "warn",
      maxFileSize: "100m",
      maxFiles: "90d",
    };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: customConfig,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    expect(() => {
      renderComponent(<LoggerSettingsTab />);
    }).not.toThrow();
  });

  it("handles loading state without errors", () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    expect(screen.getByText("Log Levels")).toBeInTheDocument();
    expect(screen.getByText("Console Level")).toBeInTheDocument();
    expect(
      screen.getByText("File Level (application.log)"),
    ).toBeInTheDocument();
  });

  it("handles multiple disabled states simultaneously", () => {
    const config = {
      ...defaultLoggerConfig,
      enableConsoleLogging: false,
      enableFileLogging: false,
    };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox1 = screen.getByRole("switch", {
      name: /enable console logging/i,
    }) as HTMLInputElement;
    const checkbox2 = screen.getByRole("switch", {
      name: /enable file logging/i,
    }) as HTMLInputElement;

    expect(checkbox1.checked).toBe(false);
    expect(checkbox2.checked).toBe(false);
  });

  it("handles all switches rendered", () => {
    renderComponent(<LoggerSettingsTab />);

    expect(screen.getByText("Enable Console Logging")).toBeInTheDocument();
    expect(
      screen.getByText("Enable File Logging (logs/ directory)"),
    ).toBeInTheDocument();
  });

  it("handles all selects rendered", () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(5);
  });

  it("handles disabled to enabled state transition for Console Logging", () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole("switch", {
      name: /enable console logging/i,
    });
    fireEvent.click(checkbox);

    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableConsoleLogging: true });
  });

  it("handles enabled to disabled state transition for File Logging", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: true };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const checkbox = screen.getByRole("switch", {
      name: /enable file logging/i,
    });
    fireEvent.click(checkbox);

    expect(mockUpdateConfig).toHaveBeenCalledWith({ enableFileLogging: false });
  });

  it("handles multiple sequential select changes", () => {
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole("combobox");
    const consoleSelect = selects[0];
    const fileSelect = selects[1];

    fireEvent.change(consoleSelect, { target: { value: "debug" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: "debug" });

    fireEvent.change(fileSelect, { target: { value: "warn" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: "warn" });

    fireEvent.change(consoleSelect, { target: { value: "error" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: "error" });
  });
});
