import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { LoggerSettingsTab } from "@/components/configuration/LoggerSettingsTab";
import * as loggerHook from "@/hooks/use-logger-config";
import { useTheme } from "@/contexts/ThemeContext";
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

describe("LoggerSettingsTab - Rendering", () => {
  beforeEach(() => {
    setupMocks();
  });

  it("renders correctly", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Log Levels")).toBeInTheDocument();
  });

  it("renders Console Logging switch", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(
      screen.getByRole("switch", { name: /enable console logging/i }),
    ).toBeInTheDocument();
  });

  it("renders Console Level select", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Console Level")).toBeInTheDocument();
  });

  it("renders File Logging switch", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(
      screen.getByRole("switch", { name: /enable file logging/i }),
    ).toBeInTheDocument();
  });

  it("renders File Level select", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(
      screen.getByText("File Level (application.log)"),
    ).toBeInTheDocument();
  });

  it("renders Error File Level select", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(
      screen.getByText("Error File Level (errors.log)"),
    ).toBeInTheDocument();
  });

  it("renders Max File Size select", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Max File Size")).toBeInTheDocument();
  });

  it("renders File Retention Period select", () => {
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("File Retention Period")).toBeInTheDocument();
  });

  it("renders with console logging disabled", () => {
    const config = { ...defaultLoggerConfig, enableConsoleLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Console Level")).toBeInTheDocument();
  });

  it("renders with file logging disabled", () => {
    const config = { ...defaultLoggerConfig, enableFileLogging: false };
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: config,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);
    expect(
      screen.getByText("File Level (application.log)"),
    ).toBeInTheDocument();
  });

  it("handles loading state", () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: true,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Log Levels")).toBeInTheDocument();
  });

  it("handles null loggerConfig", () => {
    (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
      loggerConfig: null,
      updateConfig: mockUpdateConfig,
      loading: false,
      clearFieldError: mockClearFieldError,
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Log Levels")).toBeInTheDocument();
  });

  it("renders with dark theme", () => {
    const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
    mockUseTheme.mockReturnValue({
      isDark: true,
      mode: "dark" as const,
      setMode: jest.fn(),
      toggleTheme: jest.fn(),
      currentTheme: {},
    });
    renderComponent(<LoggerSettingsTab />);
    expect(screen.getByText("Log Levels")).toBeInTheDocument();
  });

  it("renders all UI elements correctly", () => {
    renderComponent(<LoggerSettingsTab />);

    expect(screen.getByText("Log Levels")).toBeInTheDocument();
    expect(screen.getByText("Console Level")).toBeInTheDocument();
    expect(
      screen.getByText("File Level (application.log)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Error File Level (errors.log)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Max File Size")).toBeInTheDocument();
    expect(screen.getByText("File Retention Period")).toBeInTheDocument();
  });
});
