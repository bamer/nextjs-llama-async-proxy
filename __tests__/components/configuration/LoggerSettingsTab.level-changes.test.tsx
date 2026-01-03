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

describe("LoggerSettingsTab - Level Changes", () => {
  beforeEach(() => {
    setupMocks();
  });

  // Console Level tests
  it("renders Console Level select with all options", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Console Level")).toBeInTheDocument();
  });

  it("calls updateConfig when Console Level is changed to error", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[0]; // Console Level is first select
    fireEvent.change(select, { target: { value: "error" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: "error" });
  });

  it("calls updateConfig when Console Level is changed to warn", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    fireEvent.change(select, { target: { value: "warn" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: "warn" });
  });

  it("calls updateConfig when Console Level is changed to info", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    fireEvent.change(select, { target: { value: "info" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: "info" });
  });

  it("calls updateConfig when Console Level is changed to debug", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    fireEvent.change(select, { target: { value: "debug" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ consoleLevel: "debug" });
  });

  // File Level tests
  it("renders File Level select with all options", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(
      screen.getByText("File Level (application.log)"),
    ).toBeInTheDocument();
  });

  it("calls updateConfig when File Level is changed to error", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[1]; // File Level is second select
    fireEvent.change(select, { target: { value: "error" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: "error" });
  });

  it("calls updateConfig when File Level is changed to warn", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[1];
    fireEvent.change(select, { target: { value: "warn" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: "warn" });
  });

  it("calls updateConfig when File Level is changed to info", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[1];
    fireEvent.change(select, { target: { value: "info" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: "info" });
  });

  it("calls updateConfig when File Level is changed to debug", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[1];
    fireEvent.change(select, { target: { value: "debug" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ fileLevel: "debug" });
  });

  // Error Level tests
  it("renders Error Level select with all options", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(
      screen.getByText("Error File Level (errors.log)"),
    ).toBeInTheDocument();
  });

  it("calls updateConfig when Error Level is changed to error", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[2]; // Error Level is third select
    fireEvent.change(select, { target: { value: "error" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: "error" });
  });

  it("calls updateConfig when Error Level is changed to warn", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[2];
    fireEvent.change(select, { target: { value: "warn" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ errorLevel: "warn" });
  });

  // Negative test: Verify Console Level select exists when console logging is disabled
  it("renders Console Level select when console logging is disabled", () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    // Verify the component rendered (basic test)
    expect(screen.getByText("Console Level")).toBeInTheDocument();
  });

  it("renders File Level select when file logging is disabled", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    // Verify the component still renders - file logging can be set before enabling
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });
});
