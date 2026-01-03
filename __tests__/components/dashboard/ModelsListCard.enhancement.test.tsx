import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import { mockModels, renderWithProviders, setupBeforeEach } from "./ModelsListCard.test.setup";

describe("ModelsListCard - Enhancement", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    setupBeforeEach();
  });

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

    await waitFor(() => {
      expect(stopButton).toBeDisabled();
    });

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

    expect(screen.getByText("LLAMA")).toBeInTheDocument();
    expect(screen.getByText("MISTRAL")).toBeInTheDocument();
    expect(screen.getByText("OTHER")).toBeInTheDocument();
  });

  it("handles theme change without errors", () => {
    const { rerender } = renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(screen.getByText("Available Models")).toBeInTheDocument();

    rerender(
      <ModelsListCard models={mockModels} isDark={true} onToggleModel={mockOnToggle} />
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
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
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
});
