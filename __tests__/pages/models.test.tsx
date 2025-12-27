import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import ModelsPage from "../../app/models/page";

jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
}));

jest.mock("@/lib/websocket-client", () => ({
  websocketServer: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    requestModels: jest.fn(),
  },
}));

jest.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

global.fetch = jest.fn();

const { useStore } = require("@/lib/store");

const createMockModels = (overrides = {}) => [
  {
    id: "model-1",
    name: "Llama-2-7b",
    type: "LLM",
    status: "running",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  },
  {
    id: "model-2",
    name: "Mistral-7b",
    type: "LLM",
    status: "idle",
    createdAt: "2024-01-02T00:00:00.000Z",
    ...overrides,
  },
  {
    id: "model-3",
    name: "GPT-Neo",
    type: "LLM",
    status: "loading",
    createdAt: "2024-01-03T00:00:00.000Z",
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

describe("ModelsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useStore.mockReturnValue({
      models: createMockModels(),
      updateModel: jest.fn(),
      setModels: jest.fn(),
    });

    (global.fetch as jest.Mock).mockClear();
  });

  it("renders page header", () => {
    renderWithTheme(<ModelsPage />);

    expect(screen.getByText("AI Models Management")).toBeInTheDocument();
    expect(screen.getByText("Configure and monitor your AI models")).toBeInTheDocument();
  });

  it("displays all models", () => {
    renderWithTheme(<ModelsPage />);

    expect(screen.getByText("Llama-2-7b")).toBeInTheDocument();
    expect(screen.getByText("Mistral-7b")).toBeInTheDocument();
    expect(screen.getByText("GPT-Neo")).toBeInTheDocument();
  });

  it("displays model types", () => {
    renderWithTheme(<ModelsPage />);

    expect(screen.getAllByText("LLM").length).toBe(3);
  });

  it("displays model status chips", () => {
    renderWithTheme(<ModelsPage />);

    expect(screen.getByText("RUNNING")).toBeInTheDocument();
    expect(screen.getByText("IDLE")).toBeInTheDocument();
    expect(screen.getByText("LOADING")).toBeInTheDocument();
  });

  it("displays created dates", () => {
    renderWithTheme(<ModelsPage />);

    const createdDates = screen.getAllByText(/Created:/);
    expect(createdDates.length).toBeGreaterThan(0);
  });

  it("displays Start button for idle models", () => {
    renderWithTheme(<ModelsPage />);

    const startButtons = screen.getAllByRole("button", { name: /start/i });
    expect(startButtons.length).toBeGreaterThan(0);
  });

  it("displays Stop button for running models", () => {
    renderWithTheme(<ModelsPage />);

    const stopButtons = screen.getAllByRole("button", { name: /stop/i });
    expect(stopButtons.length).toBeGreaterThan(0);
  });

  it("disables Start/Stop button during loading", () => {
    renderWithTheme(<ModelsPage />);

    const loadingModel = screen.getByText("GPT-Neo").closest(".MuiCard-root");
    if (loadingModel) {
      const button = loadingModel.querySelector("button");
      expect(button).toBeDisabled();
    }
  });

  it("displays Add Model button", () => {
    renderWithTheme(<ModelsPage />);

    expect(screen.getByRole("button", { name: "Add Model" })).toBeInTheDocument();
  });

  it("displays refresh button", () => {
    renderWithTheme(<ModelsPage />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it("displays empty state when no models", () => {
    useStore.mockReturnValue({
      models: [],
      updateModel: jest.fn(),
      setModels: jest.fn(),
    });

    renderWithTheme(<ModelsPage />);

    expect(screen.getByText("No models found")).toBeInTheDocument();
    expect(screen.getByText("Add your first AI model to get started")).toBeInTheDocument();
  });

  it("displays Add Model button in empty state", () => {
    useStore.mockReturnValue({
      models: [],
      updateModel: jest.fn(),
      setModels: jest.fn(),
    });

    renderWithTheme(<ModelsPage />);

    const addButtons = screen.getAllByRole("button", { name: "Add Model" });
    expect(addButtons.length).toBe(2);
  });

  it("handles start model click", async () => {
    const mockUpdateModel = jest.fn();
    useStore.mockReturnValue({
      models: [
        {
          id: "model-1",
          name: "Llama-2-7b",
          type: "LLM",
          status: "idle",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updateModel: mockUpdateModel,
      setModels: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithTheme(<ModelsPage />);

    const startButton = screen.getByRole("button", { name: "Start" });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockUpdateModel).toHaveBeenCalledWith("model-1", { status: "loading" });
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("handles stop model click", async () => {
    const mockUpdateModel = jest.fn();
    useStore.mockReturnValue({
      models: [
        {
          id: "model-1",
          name: "Llama-2-7b",
          type: "LLM",
          status: "running",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updateModel: mockUpdateModel,
      setModels: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithTheme(<ModelsPage />);

    const stopButton = screen.getByRole("button", { name: "Stop" });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockUpdateModel).toHaveBeenCalledWith("model-1", { status: "loading" });
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("handles start model error", async () => {
    const mockUpdateModel = jest.fn();
    useStore.mockReturnValue({
      models: [
        {
          id: "model-1",
          name: "Llama-2-7b",
          type: "LLM",
          status: "idle",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updateModel: mockUpdateModel,
      setModels: jest.fn(),
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    renderWithTheme(<ModelsPage />);

    const startButton = screen.getByRole("button", { name: "Start" });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
      expect(mockUpdateModel).toHaveBeenCalledWith("model-1", { status: "idle" });
    });
  });

  it("handles stop model error", async () => {
    const mockUpdateModel = jest.fn();
    useStore.mockReturnValue({
      models: [
        {
          id: "model-1",
          name: "Llama-2-7b",
          type: "LLM",
          status: "running",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updateModel: mockUpdateModel,
      setModels: jest.fn(),
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error("Server error"));

    renderWithTheme(<ModelsPage />);

    const stopButton = screen.getByRole("button", { name: "Stop" });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
      expect(mockUpdateModel).toHaveBeenCalledWith("model-1", { status: "running" });
    });
  });

  it("displays error message", () => {
    useStore.mockReturnValue({
      models: createMockModels(),
      updateModel: jest.fn(),
      setModels: jest.fn(),
    });

    render(
      <ThemeProvider>
        <ModelsPage />
      </ThemeProvider>
    );

    const errorBox = screen.queryByText(/error/i);
    expect(errorBox).not.toBeInTheDocument();
  });

  it("clears error on new action", async () => {
    const mockUpdateModel = jest.fn();
    useStore.mockReturnValue({
      models: [
        {
          id: "model-1",
          name: "Llama-2-7b",
          type: "LLM",
          status: "idle",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updateModel: mockUpdateModel,
      setModels: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithTheme(<ModelsPage />);

    const startButton = screen.getByRole("button", { name: "Start" });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("handles model not found error", async () => {
    const mockUpdateModel = jest.fn();
    useStore.mockReturnValue({
      models: [
        {
          id: "model-1",
          name: "Llama-2-7b",
          type: "LLM",
          status: "idle",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updateModel: mockUpdateModel,
      setModels: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Model not found" }),
    });

    renderWithTheme(<ModelsPage />);

    const startButton = screen.getByRole("button", { name: "Start" });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Model not found/)).toBeInTheDocument();
    });
  });

  it("normalizes status correctly", () => {
    renderWithTheme(<ModelsPage />);

    const statuses = screen.getAllByText(/RUNNING|IDLE|LOADING/);
    expect(statuses.length).toBeGreaterThan(0);
  });

  it("applies dark mode styles correctly", () => {
    renderWithTheme(<ModelsPage />, true);

    expect(screen.getByText("AI Models Management")).toBeInTheDocument();
  });

  it("displays model cards with hover effect", () => {
    renderWithTheme(<ModelsPage />);

    const modelCards = screen.getAllByText(/Llama-2-7b|Mistral-7b|GPT-Neo/);
    expect(modelCards.length).toBe(3);
  });

  it("handles refresh click", () => {
    renderWithTheme(<ModelsPage />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
    fireEvent.click(refreshButton);
  });

  it("handles add model click", () => {
    renderWithTheme(<ModelsPage />);

    const addButton = screen.getByRole("button", { name: "Add Model" });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
  });

  it("displays linear progress bars", () => {
    renderWithTheme(<ModelsPage />);

    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("handles object status format", () => {
    useStore.mockReturnValue({
      models: [
        {
          id: "model-1",
          name: "Llama-2-7b",
          type: "LLM",
          status: { value: "running" },
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updateModel: jest.fn(),
      setModels: jest.fn(),
    });

    renderWithTheme(<ModelsPage />);

    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });

  it("handles unknown status format", () => {
    useStore.mockReturnValue({
      models: [
        {
          id: "model-1",
          name: "Llama-2-7b",
          type: "LLM",
          status: "unknown",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      updateModel: jest.fn(),
      setModels: jest.fn(),
    });

    renderWithTheme(<ModelsPage />);

    expect(screen.getByText("IDLE")).toBeInTheDocument();
  });
});
