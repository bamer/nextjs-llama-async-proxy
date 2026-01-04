import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import type { MockModelConfig } from "__tests__/types/mock-types";
import { renderWithProviders, setupTestMocks, mockModels, loadingModels } from "./test-utils";

const mockOnToggle = jest.fn();

beforeEach(() => {
  setupTestMocks();
});

describe("ModelsListCard Enhancement Tests", () => {
  it("encodes model name in API URL correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const specialNameModels: MockModelConfig[] = [{ id: "model1", name: "Model with spaces & symbols", status: "idle", type: "llama" }];

    renderWithProviders(<ModelsListCard models={specialNameModels} isDark={false} onToggleModel={mockOnToggle} />);
    fireEvent.click(screen.getByText("Start"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent("Model with spaces & symbols")), expect.any(Object));
    });
  });

  it("shows loading state during API call", async () => {
    let resolveFetch: () => void;
    const fetchPromise = new Promise<void>((resolve) => { resolveFetch = resolve; });
    (global.fetch as jest.Mock).mockReturnValue({ ok: true, json: () => fetchPromise });

    renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    const stopButton = screen.getByText("Stop");
    fireEvent.click(stopButton);

    await waitFor(() => expect(stopButton).toBeDisabled());
    resolveFetch!();
  });

  it("handles all model types (llama, mistral, other)", () => {
    const allTypeModels: MockModelConfig[] = [
      { id: "model1", name: "Llama Model", status: "running", type: "llama" },
      { id: "model2", name: "Mistral Model", status: "idle", type: "mistral" },
      { id: "model3", name: "Other Model", status: "idle", type: "other" },
    ];

    renderWithProviders(<ModelsListCard models={allTypeModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("LLAMA")).toBeInTheDocument();
    expect(screen.getByText("MISTRAL")).toBeInTheDocument();
    expect(screen.getByText("OTHER")).toBeInTheDocument();
  });

  it("applies correct status colors", () => {
    const allStatusModels: MockModelConfig[] = [
      { id: "model1", name: "Running", status: "running", type: "llama" },
      { id: "model2", name: "Loading", status: "loading", type: "mistral", progress: 50 },
      { id: "model3", name: "Error", status: "error", type: "other" },
    ];

    renderWithProviders(<ModelsListCard models={allStatusModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
    expect(screen.getByText("Loading... 50%")).toBeInTheDocument();
    expect(screen.getByText("ERROR")).toBeInTheDocument();
  });

  it("handles theme change without errors", () => {
    const { rerender } = renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Available Models")).toBeInTheDocument();

    rerender(<ModelsListCard models={mockModels} isDark={true} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Available Models")).toBeInTheDocument();
  });

  it("maintains correct button states across re-renders", () => {
    const { rerender } = renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Stop")).toBeInTheDocument();

    rerender(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Stop")).toBeInTheDocument();
  });

  it("shows correct button text for running model", () => {
    renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Stop")).toBeInTheDocument();
  });

  it("shows correct button text for idle model", () => {
    renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("disables button for loading model", async () => {
    renderWithProviders(<ModelsListCard models={loadingModels} isDark={false} onToggleModel={mockOnToggle} />);
    const startButton = await screen.findByRole("button", { name: /Start/i });
    expect(startButton).toBeDisabled();
  });

  it("handles multiple loading states simultaneously", async () => {
    const multiLoadingModels: MockModelConfig[] = [
      { id: "model1", name: "Loading 1", status: "loading", type: "llama", progress: 50 },
      { id: "model2", name: "Loading 2", status: "loading", type: "mistral", progress: 75 },
    ];

    renderWithProviders(<ModelsListCard models={multiLoadingModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Loading... 50%")).toBeInTheDocument();
    expect(screen.getByText("Loading... 75%")).toBeInTheDocument();
  });

  it("applies correct progress bar values", () => {
    const progressModels: MockModelConfig[] = [{ id: "model1", name: "Progress Model", status: "loading", type: "llama", progress: 67 }];
    renderWithProviders(<ModelsListCard models={progressModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Loading... 67%")).toBeInTheDocument();
  });
});
