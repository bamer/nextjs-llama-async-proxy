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

describe("LoggerSettingsTab - File Configuration", () => {
  beforeEach(() => {
    setupMocks();
  });

  // Max File Size tests
  it("renders Max File Size select with all options", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Max File Size")).toBeInTheDocument();
  });

  it("calls updateConfig when Max File Size is changed to 10m", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[3]; // Max File Size is fourth select
    fireEvent.change(select, { target: { value: "10m" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: "10m" });
  });

  it("calls updateConfig when Max File Size is changed to 20m", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[3];
    fireEvent.change(select, { target: { value: "20m" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: "20m" });
  });

  it("calls updateConfig when Max File Size is changed to 50m", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[3];
    fireEvent.change(select, { target: { value: "50m" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: "50m" });
  });

  it("calls updateConfig when Max File Size is changed to 100m", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[3];
    fireEvent.change(select, { target: { value: "100m" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: "100m" });
  });

  it("calls updateConfig when Max File Size is changed to 500m", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[3];
    fireEvent.change(select, { target: { value: "500m" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFileSize: "500m" });
  });

  // File Retention Period tests
  it("renders File Retention Period select with all options", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("File Retention Period")).toBeInTheDocument();
  });

  it("calls updateConfig when File Retention is changed to 7d", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[4]; // File Retention is fifth select
    fireEvent.change(select, { target: { value: "7d" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: "7d" });
  });

  it("calls updateConfig when File Retention is changed to 14d", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[4];
    fireEvent.change(select, { target: { value: "14d" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: "14d" });
  });

  it("calls updateConfig when File Retention is changed to 30d", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[4];
    fireEvent.change(select, { target: { value: "30d" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: "30d" });
  });

  it("calls updateConfig when File Retention is changed to 60d", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[4];
    fireEvent.change(select, { target: { value: "60d" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: "60d" });
  });

  it("calls updateConfig when File Retention is changed to 90d", () => {
    renderComponent(<LoggerSettingsTab />);
    const selects = screen.getAllByRole("combobox");
    const select = selects[4];
    fireEvent.change(select, { target: { value: "90d" } });
    expect(mockUpdateConfig).toHaveBeenCalledWith({ maxFiles: "90d" });
  });

  // Disable state tests when file logging is disabled
  it("disables file level select when file logging is disabled", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole("combobox");
    const fileSelect = selects[1];
    expect(fileSelect).toBeDisabled();
  });

  it("disables error level select when file logging is disabled", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole("combobox");
    const errorSelect = selects[2];
    expect(errorSelect).toBeDisabled();
  });

  it("disables max file size select when file logging is disabled", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole("combobox");
    const maxSizeSelect = selects[3];
    expect(maxSizeSelect).toBeDisabled();
  });

  it("disables file retention select when file logging is disabled", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole("combobox");
    const retentionSelect = selects[4];
    expect(retentionSelect).toBeDisabled();
  });

  it("disables console level select when console logging is disabled", () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);

    const selects = screen.getAllByRole("combobox");
    const consoleSelect = selects[0];
    expect(consoleSelect).toBeDisabled();
  });
});
