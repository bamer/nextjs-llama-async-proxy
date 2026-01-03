import { screen } from "@testing-library/react";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import { mockModels, renderWithProviders, setupBeforeEach } from "./ModelsListCard.test.setup";

describe("ModelsListCard - Basic Rendering", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    setupBeforeEach();
  });

  it("renders correctly with models", () => {
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

    expect(screen.getByText("LLAMA")).toBeInTheDocument();
    expect(screen.getByText("MISTRAL")).toBeInTheDocument();
  });

  it("displays correct status labels", () => {
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

  it("displays Start and Stop buttons for each model", () => {
    renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
  });
});
