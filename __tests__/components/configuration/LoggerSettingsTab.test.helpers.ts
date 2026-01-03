import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { LoggerSettingsTab } from "@/components/configuration/LoggerSettingsTab";
import * as loggerHook from "@/hooks/use-logger-config";
import { useTheme } from "@/contexts/ThemeContext";

export const mockUpdateConfig = jest.fn();
export const mockClearFieldError = jest.fn();

export const defaultLoggerConfig = {
  enableConsoleLogging: true,
  consoleLevel: "info",
  enableFileLogging: true,
  fileLevel: "info",
  errorLevel: "error",
  maxFileSize: "20m",
  maxFiles: "30d",
};

export function setupMocks(
  config = defaultLoggerConfig,
  loading = false,
): void {
  jest.clearAllMocks();
  jest.mocked(useTheme).mockReturnValue({
    isDark: false,
    mode: "light" as const,
    setMode: jest.fn(),
    toggleTheme: jest.fn(),
    currentTheme: {},
  });
  (loggerHook.useLoggerConfig as jest.Mock).mockReturnValue({
    loggerConfig: config,
    updateConfig: mockUpdateConfig,
    loading,
    clearFieldError: mockClearFieldError,
  });
}

export function renderComponent(component: React.ReactElement) {
  try {
    return render(component);
  } catch (error) {
    console.error("Render error:", error);
    console.error("Component type:", typeof component.type, component.type);
    throw error;
  }
}

export function getAllSelects(): HTMLElement[] {
  return screen.getAllByRole("combobox");
}

export function getSelectByIndex(index: number): HTMLElement {
  const selects = getAllSelects();
  return selects[index];
}
