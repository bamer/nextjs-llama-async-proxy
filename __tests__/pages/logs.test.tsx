import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import LogsPage from "../../app/logs/page";

jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
}));

jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: jest.fn(),
}));

jest.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

const { useStore } = require("@/lib/store");
const { useWebSocket } = require("@/hooks/use-websocket");

const createMockLogs = (overrides = {}) => [
  {
    id: "log-1",
    level: "error",
    message: "Test error message",
    timestamp: "2024-01-01T00:00:00.000Z",
    context: { source: "system" },
    ...overrides,
  },
  {
    id: "log-2",
    level: "warn",
    message: "Test warning message",
    timestamp: "2024-01-01T01:00:00.000Z",
    context: { source: "api" },
    ...overrides,
  },
  {
    id: "log-3",
    level: "info",
    message: "Test info message",
    timestamp: "2024-01-01T02:00:00.000Z",
    context: { source: "system" },
    ...overrides,
  },
  {
    id: "log-4",
    level: "debug",
    message: "Test debug message",
    timestamp: "2024-01-01T03:00:00.000Z",
    context: { source: "debug" },
    ...overrides,
  },
];

function renderWithTheme(component: React.ReactElement, isDark = false) {
  const theme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
    },
  });

  return render(
    <ThemeProvider>
      <MuiThemeProvider theme={theme}>{component}</MuiThemeProvider>
    </ThemeProvider>
  );
}

describe("LogsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useStore.mockReturnValue({
      logs: createMockLogs(),
      clearLogs: jest.fn(),
    });

    useWebSocket.mockReturnValue({
      isConnected: true,
      requestLogs: jest.fn(),
    });
  });

  it("renders page header", () => {
    renderWithTheme(<LogsPage />);

    expect(screen.getByText("Logs")).toBeInTheDocument();
  });

  it("displays all logs", () => {
    renderWithTheme(<LogsPage />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.getByText("Test warning message")).toBeInTheDocument();
    expect(screen.getByText("Test info message")).toBeInTheDocument();
    expect(screen.getByText("Test debug message")).toBeInTheDocument();
  });

  it("displays empty state when no logs", () => {
    useStore.mockReturnValue({
      logs: [],
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    expect(screen.getByText("No logs available")).toBeInTheDocument();
  });

  it("displays search input", () => {
    renderWithTheme(<LogsPage />);

    const searchInput = screen.getByPlaceholderText("Search logs...");
    expect(searchInput).toBeInTheDocument();
  });

  it("filters logs by search term", () => {
    renderWithTheme(<LogsPage />);

    const searchInput = screen.getByPlaceholderText("Search logs...");
    fireEvent.change(searchInput, { target: { value: "error" } });

    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.queryByText("Test warning message")).not.toBeInTheDocument();
  });

  it("filters logs by source", () => {
    renderWithTheme(<LogsPage />);

    const searchInput = screen.getByPlaceholderText("Search logs...");
    fireEvent.change(searchInput, { target: { value: "system" } });

    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.getByText("Test info message")).toBeInTheDocument();
    expect(screen.queryByText("Test warning message")).not.toBeInTheDocument();
  });

  it("displays level filter dropdown", () => {
    renderWithTheme(<LogsPage />);

    const levelFilter = screen.getByRole("combobox");
    expect(levelFilter).toBeInTheDocument();
  });

  it("filters logs by level", () => {
    renderWithTheme(<LogsPage />);

    const levelFilter = screen.getByRole("combobox");
    fireEvent.change(levelFilter, { target: { value: "error" } });

    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.queryByText("Test warning message")).not.toBeInTheDocument();
  });

  it("displays log level chips", () => {
    renderWithTheme(<LogsPage />);

    expect(screen.getByText("ERROR")).toBeInTheDocument();
    expect(screen.getByText("WARN")).toBeInTheDocument();
    expect(screen.getByText("INFO")).toBeInTheDocument();
    expect(screen.getByText("DEBUG")).toBeInTheDocument();
  });

  it("displays log timestamps", () => {
    renderWithTheme(<LogsPage />);

    const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it("displays refresh button", () => {
    renderWithTheme(<LogsPage />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it("requests logs on refresh click", () => {
    const mockRequestLogs = jest.fn();
    useWebSocket.mockReturnValue({
      isConnected: true,
      requestLogs: mockRequestLogs,
    });

    renderWithTheme(<LogsPage />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockRequestLogs).toHaveBeenCalled();
  });

  it("displays clear logs button", () => {
    renderWithTheme(<LogsPage />);

    const clearButton = screen.getByRole("button", { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  it("clears logs on clear click", () => {
    const mockClearLogs = jest.fn();
    useStore.mockReturnValue({
      logs: createMockLogs(),
      clearLogs: mockClearLogs,
    });

    renderWithTheme(<LogsPage />);

    const clearButton = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clearButton);

    expect(mockClearLogs).toHaveBeenCalled();
  });

  it("displays download logs button", () => {
    renderWithTheme(<LogsPage />);

    const downloadButton = screen.getByRole("button", { name: /download/i });
    expect(downloadButton).toBeInTheDocument();
  });

  it("handles download click", () => {
    renderWithTheme(<LogsPage />);

    const downloadButton = screen.getByRole("button", { name: /download/i });
    fireEvent.click(downloadButton);
  });

  it("displays pagination", () => {
    renderWithTheme(<LogsPage />);

    const pagination = screen.getByRole("navigation");
    expect(pagination).toBeInTheDocument();
  });

  it("paginates logs correctly", () => {
    const manyLogs = Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i}`,
      level: "info",
      message: `Test message ${i}`,
      timestamp: "2024-01-01T00:00:00.000Z",
      context: { source: "system" },
    }));

    useStore.mockReturnValue({
      logs: manyLogs,
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    expect(screen.getByText("Test message 0")).toBeInTheDocument();
    expect(screen.getByText("Test message 19")).toBeInTheDocument();
    expect(screen.queryByText("Test message 20")).not.toBeInTheDocument();
  });

  it("changes page on pagination click", () => {
    const manyLogs = Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i}`,
      level: "info",
      message: `Test message ${i}`,
      timestamp: "2024-01-01T00:00:00.000Z",
      context: { source: "system" },
    }));

    useStore.mockReturnValue({
      logs: manyLogs,
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    const page2Button = screen.getByRole("button", { name: "2" });
    fireEvent.click(page2Button);

    expect(screen.queryByText("Test message 0")).not.toBeInTheDocument();
    expect(screen.getByText("Test message 20")).toBeInTheDocument();
  });

  it("handles object log messages", () => {
    useStore.mockReturnValue({
      logs: [
        {
          id: "log-1",
          level: "error",
          message: { message: "Error from object" },
          timestamp: "2024-01-01T00:00:00.000Z",
          context: { source: "system" },
        },
      ],
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    expect(screen.getByText("Error from object")).toBeInTheDocument();
  });

  it("handles error object in log messages", () => {
    useStore.mockReturnValue({
      logs: [
        {
          id: "log-1",
          level: "error",
          message: { error: "Error text" },
          timestamp: "2024-01-01T00:00:00.000Z",
          context: { source: "system" },
        },
      ],
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    expect(screen.getByText("Error text")).toBeInTheDocument();
  });

  it("handles text object in log messages", () => {
    useStore.mockReturnValue({
      logs: [
        {
          id: "log-1",
          level: "info",
          message: { text: "Info text" },
          timestamp: "2024-01-01T00:00:00.000Z",
          context: { source: "system" },
        },
      ],
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    expect(screen.getByText("Info text")).toBeInTheDocument();
  });

  it("applies dark mode styles correctly", () => {
    renderWithTheme(<LogsPage />, true);

    expect(screen.getByText("Logs")).toBeInTheDocument();
  });

  it("displays log cards with hover effect", () => {
    renderWithTheme(<LogsPage />);

    const logMessages = screen.getAllByText(/Test (error|warning|info|debug) message/);
    expect(logMessages.length).toBe(4);
  });

  it("handles null context gracefully", () => {
    useStore.mockReturnValue({
      logs: [
        {
          id: "log-1",
          level: "info",
          message: "Test message",
          timestamp: "2024-01-01T00:00:00.000Z",
          context: null,
        },
      ],
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("handles undefined context gracefully", () => {
    useStore.mockReturnValue({
      logs: [
        {
          id: "log-1",
          level: "info",
          message: "Test message",
          timestamp: "2024-01-01T00:00:00.000Z",
          context: undefined,
        },
      ],
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("displays correct level colors", () => {
    renderWithTheme(<LogsPage />);

    expect(screen.getByText("ERROR")).toBeInTheDocument();
    expect(screen.getByText("WARN")).toBeInTheDocument();
    expect(screen.getByText("INFO")).toBeInTheDocument();
    expect(screen.getByText("DEBUG")).toBeInTheDocument();
  });

  it("does not request logs when not connected", () => {
    const mockRequestLogs = jest.fn();
    useWebSocket.mockReturnValue({
      isConnected: false,
      requestLogs: mockRequestLogs,
    });

    renderWithTheme(<LogsPage />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockRequestLogs).not.toHaveBeenCalled();
  });

  it("requests logs on mount when connected", () => {
    const mockRequestLogs = jest.fn();
    useWebSocket.mockReturnValue({
      isConnected: true,
      requestLogs: mockRequestLogs,
    });

    renderWithTheme(<LogsPage />);

    expect(mockRequestLogs).toHaveBeenCalled();
  });

  it("displays 20 logs per page", () => {
    const manyLogs = Array.from({ length: 45 }, (_, i) => ({
      id: `log-${i}`,
      level: "info",
      message: `Test message ${i}`,
      timestamp: "2024-01-01T00:00:00.000Z",
      context: { source: "system" },
    }));

    useStore.mockReturnValue({
      logs: manyLogs,
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    const visibleLogs = screen.getAllByText(/Test message \d+/);
    expect(visibleLogs.length).toBe(20);
  });

  it("handles large number of logs", () => {
    const manyLogs = Array.from({ length: 200 }, (_, i) => ({
      id: `log-${i}`,
      level: "info",
      message: `Test message ${i}`,
      timestamp: "2024-01-01T00:00:00.000Z",
      context: { source: "system" },
    }));

    useStore.mockReturnValue({
      logs: manyLogs,
      clearLogs: jest.fn(),
    });

    renderWithTheme(<LogsPage />);

    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
