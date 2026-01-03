import { screen } from "@testing-library/react";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import { renderWithProviders, setupBeforeEach } from "./ModelsListCard.test.setup";

describe("ModelsListCard - Loading & Progress", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    setupBeforeEach();
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

    const progressText = screen.getAllByText("Loading... 45%");
    expect(progressText.length).toBeGreaterThan(0);
    const progressBar = screen.getByTestId("linear-progress");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("value", "45");
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
    const loadingText = screen.getAllByText("Loading... 50%");
    expect(loadingText.length).toBeGreaterThan(0);
    expect(screen.getByText("ERROR")).toBeInTheDocument();
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

    const zeroPercent = screen.getAllByText("Loading... 0%");
    const hundredPercent = screen.getAllByText("Loading... 100%");
    expect(zeroPercent.length).toBeGreaterThan(0);
    expect(hundredPercent.length).toBeGreaterThan(0);
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

    expect(screen.getAllByText("Loading... 50%").length).toBe(1);
    expect(screen.getAllByText("Loading... 75%").length).toBe(1);
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

    expect(screen.getAllByText("Loading... 67%").length).toBe(1);
  });
});
