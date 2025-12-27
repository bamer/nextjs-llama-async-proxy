import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";

// Mock fetch globally
global.fetch = jest.fn();

const theme = createTheme();

function renderWithProviders(component: React.ReactElement) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
  );
  return render(component, { wrapper });
}

describe("ModelsListCard", () => {
  const mockModels = [
    {
      id: "model1",
      name: "Llama 2 7B",
      status: "running" as const,
      type: "llama" as const,
    },
    {
      id: "model2",
      name: "Mistral 7B",
      status: "idle" as const,
      type: "mistral" as const,
    },
  ];

  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  // POSITIVE TESTS - Verifying correct functionality
  describe("Positive Tests", () => {
    it("renders correctly with models - Objective: Test component rendering with valid props", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("Available Models")).toBeInTheDocument();
      expect(screen.getByText("2 models")).toBeInTheDocument();
    });

    it("displays all model names", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("Llama 2 7B")).toBeInTheDocument();
      expect(screen.getByText("Mistral 7B")).toBeInTheDocument();
    });

    it("displays model types", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("llama")).toBeInTheDocument();
      expect(screen.getByText("mistral")).toBeInTheDocument();
    });

    it("displays correct status labels - Objective: Test status display", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("RUNNING")).toBeInTheDocument();
      expect(screen.getByText("STOPPED")).toBeInTheDocument();
    });

    it("displays Stop button for running model", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const stopButton = screen.getByText("Stop");
      expect(stopButton).toBeInTheDocument();
    });

    it("displays Start button for idle model", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const startButton = screen.getByText("Start");
      expect(startButton).toBeInTheDocument();
    });

    it("calls onToggleModel when stopping a running model - Objective: Test user interaction", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const stopButton = screen.getByText("Stop");
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith("model1");
      });
    });

    it("calls onToggleModel when starting an idle model", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const startButton = screen.getAllByText("Start")[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith("model2");
      });
    });

    it("displays progress bar for loading model", () => {
      const loadingModels = [
        {
          id: "model1",
          name: "Loading Model",
          status: "loading" as const,
          type: "llama" as const,
          progress: 45,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={loadingModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("LOADING")).toBeInTheDocument();
      expect(screen.getByText("Loading... 45%")).toBeInTheDocument();
    });

    it("displays ERROR status for error model", () => {
      const errorModels = [
        {
          id: "model1",
          name: "Error Model",
          status: "error" as const,
          type: "llama" as const,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={errorModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("ERROR")).toBeInTheDocument();
    });

    it("renders with dark mode styling", () => {
      const { container } = renderWithProviders(
        <ModelsListCard models={mockModels} isDark={true} onToggleModel={mockOnToggle} />
      );

      const card = container.querySelector(".MuiCard-root");
      expect(card).toBeInTheDocument();
    });

    it("renders with light mode styling", () => {
      const { container } = renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const card = container.querySelector(".MuiCard-root");
      expect(card).toBeInTheDocument();
    });

    it("handles all model statuses", () => {
      const allStatusModels = [
        { id: "model1", name: "Running Model", status: "running" as const, type: "llama" as const },
        { id: "model2", name: "Idle Model", status: "idle" as const, type: "mistral" as const },
        { id: "model3", name: "Loading Model", status: "loading" as const, type: "other" as const, progress: 50 },
        { id: "model4", name: "Error Model", status: "error" as const, type: "llama" as const },
      ];

      renderWithProviders(
        <ModelsListCard models={allStatusModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("RUNNING")).toBeInTheDocument();
      expect(screen.getByText("STOPPED")).toBeInTheDocument();
      expect(screen.getByText("LOADING")).toBeInTheDocument();
      expect(screen.getByText("ERROR")).toBeInTheDocument();
    });

    it("displays more buttons for each model", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const moreButtons = screen.getAllByRole("button").filter(
        (btn) => !btn.textContent?.includes("Start") && !btn.textContent?.includes("Stop")
      );

      expect(moreButtons.length).toBe(2); // One more button for each model
    });

    it("updates loading state during model toggle", async () => {
      let resolveFetch: () => void;
      const fetchPromise = new Promise<void>((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue({
        ok: true,
        json: () => fetchPromise,
      });

      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const stopButton = screen.getByText("Stop");
      fireEvent.click(stopButton);

      // Button text should change
      expect(screen.getByText("Stopping...")).toBeInTheDocument();

      resolveFetch!();
      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalled();
      });
    });
  });

  // NEGATIVE TESTS - Verifying error handling and edge cases
  describe("Negative Tests", () => {
    it("handles empty models array gracefully - Objective: Test edge case with no models", () => {
      renderWithProviders(
        <ModelsListCard models={[]} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("0 models")).toBeInTheDocument();
    });

    it("handles null models", () => {
      renderWithProviders(
        <ModelsListCard models={null as any} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("Available Models")).toBeInTheDocument();
    });

    it("handles undefined models", () => {
      renderWithProviders(
        <ModelsListCard models={undefined as any} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("Available Models")).toBeInTheDocument();
    });

    it("handles API error when starting model", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Failed to start model" }),
      });

      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const startButton = screen.getAllByText("Start")[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Failed to start model");
      });

      alertMock.mockRestore();
    });

    it("handles API error when stopping model", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const consoleErrorMock = jest.spyOn(console, "error").mockImplementation(() => {});
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const stopButton = screen.getByText("Stop");
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(consoleErrorMock).toHaveBeenCalled();
      });

      consoleErrorMock.mockRestore();
      alertMock.mockRestore();
    });

    it("disables button during loading state", async () => {
      const loadingModels = [
        {
          id: "model1",
          name: "Loading Model",
          status: "loading" as const,
          type: "llama" as const,
          progress: 50,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={loadingModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      // Wait for async state to update
      await new Promise(resolve => setTimeout(resolve, 50));

      const startButton = screen.getByText("Start");
      expect(startButton.closest("button")).toBeDisabled();
    });

    it("handles very large number of models - Objective: Test performance with many models", () => {
      const manyModels = Array.from({ length: 100 }, (_, i) => ({
        id: `model${i}`,
        name: `Model ${i}`,
        status: i % 2 === 0 ? ("running" as const) : ("idle" as const),
        type: "llama" as const,
      }));

      renderWithProviders(
        <ModelsListCard models={manyModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("100 models")).toBeInTheDocument();
    });

    it("handles model with special characters in name", () => {
      const specialCharModels = [
        {
          id: "model1",
          name: 'Model-α_β 🚀 & "test"',
          status: "running" as const,
          type: "llama" as const,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={specialCharModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText('Model-α_β 🚀 & "test"')).toBeInTheDocument();
    });

    it("handles model with empty name", () => {
      const emptyNameModels = [
        {
          id: "model1",
          name: "",
          status: "running" as const,
          type: "llama" as const,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={emptyNameModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("1 models")).toBeInTheDocument();
    });

    it("handles model without progress in loading state", () => {
      const noProgressModels = [
        {
          id: "model1",
          name: "No Progress Model",
          status: "loading" as const,
          type: "llama" as const,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={noProgressModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("LOADING")).toBeInTheDocument();
    });

    it("handles null onToggleModel without crashing", () => {
      expect(() => {
        renderWithProviders(
          <ModelsListCard models={mockModels} isDark={false} onToggleModel={null as any} />
        );
      }).not.toThrow();
    });

    it("handles rapid button clicks without errors - Objective: Test race conditions", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const stopButton = screen.getByText("Stop");

      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        fireEvent.click(stopButton);
      }

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalled();
      });
    });

    it("handles models with duplicate names but different IDs", () => {
      const duplicateNameModels = [
        { id: "model1", name: "Same Name", status: "running" as const, type: "llama" as const },
        { id: "model2", name: "Same Name", status: "idle" as const, type: "mistral" as const },
      ];

      renderWithProviders(
        <ModelsListCard models={duplicateNameModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const sameNameElements = screen.getAllByText("Same Name");
      expect(sameNameElements.length).toBe(2);
    });

    it("handles progress at boundaries (0% and 100%)", () => {
      const boundaryModels = [
        {
          id: "model1",
          name: "0% Progress",
          status: "loading" as const,
          type: "llama" as const,
          progress: 0,
        },
        {
          id: "model2",
          name: "100% Progress",
          status: "loading" as const,
          type: "mistral" as const,
          progress: 100,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={boundaryModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("Loading... 0%")).toBeInTheDocument();
      expect(screen.getByText("Loading... 100%")).toBeInTheDocument();
    });
  });

  // ENHANCEMENT TESTS - Additional coverage for API and edge cases
  describe("Enhancement Tests", () => {
    it("encodes model name in API URL correctly", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const specialNameModels = [
        {
          id: "model1",
          name: "Model with spaces & symbols",
          status: "idle" as const,
          type: "llama" as const,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={specialNameModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const startButton = screen.getByText("Start");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(encodeURIComponent("Model with spaces & symbols")),
          expect.any(Object)
        );
      });
    });

    it("shows loading state during API call", async () => {
      let resolveFetch: () => void;
      const fetchPromise = new Promise<void>((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue({
        ok: true,
        json: () => fetchPromise,
      });

      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const stopButton = screen.getByText("Stop");
      fireEvent.click(stopButton);

      // Check for loading state
      expect(screen.getByText("Stopping...")).toBeInTheDocument();

      resolveFetch!();
    });

    it("handles all model types (llama, mistral, other)", () => {
      const allTypeModels = [
        { id: "model1", name: "Llama Model", status: "running" as const, type: "llama" as const },
        { id: "model2", name: "Mistral Model", status: "idle" as const, type: "mistral" as const },
        { id: "model3", name: "Other Model", status: "idle" as const, type: "other" as const },
      ];

      renderWithProviders(
        <ModelsListCard models={allTypeModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("llama")).toBeInTheDocument();
      expect(screen.getByText("mistral")).toBeInTheDocument();
      expect(screen.getByText("other")).toBeInTheDocument();
    });

    it("applies correct status colors", () => {
      const allStatusModels = [
        { id: "model1", name: "Running", status: "running" as const, type: "llama" as const },
        { id: "model2", name: "Loading", status: "loading" as const, type: "mistral" as const, progress: 50 },
        { id: "model3", name: "Error", status: "error" as const, type: "other" as const },
      ];

      renderWithProviders(
        <ModelsListCard models={allStatusModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("RUNNING")).toBeInTheDocument();
      expect(screen.getByText("LOADING")).toBeInTheDocument();
      expect(screen.getByText("ERROR")).toBeInTheDocument();
    });

    it("handles theme change without errors", () => {
      const { rerender } = renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("Available Models")).toBeInTheDocument();

      rerender(
        <MuiThemeProvider theme={theme}>
          <ModelsListCard models={mockModels} isDark={true} onToggleModel={mockOnToggle} />
        </MuiThemeProvider>
      );

      expect(screen.getByText("Available Models")).toBeInTheDocument();
    });

    it("maintains correct button states across re-renders", () => {
      const { rerender } = renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const stopButton = screen.getByText("Stop");
      expect(stopButton).toBeInTheDocument();

      rerender(
        <MuiThemeProvider theme={theme}>
          <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
        </MuiThemeProvider>
      );

      expect(screen.getByText("Stop")).toBeInTheDocument();
    });

    it("shows correct button text for running model", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const runningModelButton = screen.getByText("Stop");
      expect(runningModelButton).toBeInTheDocument();
    });

    it("shows correct button text for idle model", () => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const idleModelButton = screen.getByText("Start");
      expect(idleModelButton).toBeInTheDocument();
    });

    it("disables button for loading model", async () => {
      const loadingModels = [
        {
          id: "model1",
          name: "Loading Model",
          status: "loading" as const,
          type: "llama" as const,
          progress: 50,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={loadingModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      const startButton = await screen.findByRole("button", { name: /Start/i });
      expect(startButton).toBeDisabled();
    });

    it("handles multiple loading states simultaneously", async () => {
      const loadingModels = [
        {
          id: "model1",
          name: "Loading Model 1",
          status: "loading" as const,
          type: "llama" as const,
          progress: 50,
        },
        {
          id: "model2",
          name: "Loading Model 2",
          status: "loading" as const,
          type: "mistral" as const,
          progress: 75,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={loadingModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("Loading... 50%")).toBeInTheDocument();
      expect(screen.getByText("Loading... 75%")).toBeInTheDocument();
    });

    it("applies correct progress bar values", () => {
      const progressModels = [
        {
          id: "model1",
          name: "Progress Model",
          status: "loading" as const,
          type: "llama" as const,
          progress: 67,
        },
      ];

      renderWithProviders(
        <ModelsListCard models={progressModels} isDark={false} onToggleModel={mockOnToggle} />
      );

      expect(screen.getByText("Loading... 67%")).toBeInTheDocument();
    });
  });
});
