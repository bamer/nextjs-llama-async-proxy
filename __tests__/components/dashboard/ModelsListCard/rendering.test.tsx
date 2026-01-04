import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import type { MockModelConfig } from "__tests__/types/mock-types";
import { renderWithProviders, setupTestMocks, mockModels, allStatusModels, loadingModels, errorModels } from "./test-utils";

const mockOnToggle = jest.fn();

beforeEach(() => {
  setupTestMocks();
});

describe("ModelsListCard Rendering", () => {
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

    expect(screen.getByText("Stop")).toBeInTheDocument();
  });

  it("displays Start button for idle model", () => {
    renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("calls onToggleModel when stopping a running model", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    fireEvent.click(screen.getByText("Stop"));

    await waitFor(() => expect(mockOnToggle).toHaveBeenCalledWith("model1"));
  });

  it("calls onToggleModel when starting an idle model", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    fireEvent.click(screen.getAllByText("Start")[0]);

    await waitFor(() => expect(mockOnToggle).toHaveBeenCalledWith("model2"));
  });

  it("displays progress bar for loading model", () => {
    renderWithProviders(
      <ModelsListCard models={loadingModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(screen.getByText("Loading... 45%")).toBeInTheDocument();
    const progressBar = screen.getByTestId("linear-progress");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("value", "45");
  });

  it("displays ERROR status for error model", () => {
    renderWithProviders(
      <ModelsListCard models={errorModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(screen.getByText("ERROR")).toBeInTheDocument();
  });

  it("renders with dark mode styling", () => {
    const { container } = renderWithProviders(
      <ModelsListCard models={mockModels} isDark={true} onToggleModel={mockOnToggle} />
    );

    expect(container.querySelector(".MuiCard-root")).toBeInTheDocument();
  });

  it("renders with light mode styling", () => {
    const { container } = renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(container.querySelector(".MuiCard-root")).toBeInTheDocument();
  });

  it("handles all model statuses", () => {
    renderWithProviders(
      <ModelsListCard models={allStatusModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(screen.getByText("RUNNING")).toBeInTheDocument();
    expect(screen.getByText("STOPPED")).toBeInTheDocument();
    expect(screen.getByText("Loading... 50%")).toBeInTheDocument();
    expect(screen.getByText("ERROR")).toBeInTheDocument();
  });

  it("displays Start and Stop buttons for each model", () => {
    renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(screen.getAllByRole("button").length).toBe(2);
  });

  it("updates loading state during model toggle", async () => {
    let resolveFetch: () => void;
    const fetchPromise = new Promise<void>((resolve) => { resolveFetch = resolve; });

    (global.fetch as jest.Mock).mockReturnValue({ ok: true, json: () => fetchPromise });

    renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    const stopButton = screen.getByText("Stop");
    fireEvent.click(stopButton);

    await waitFor(() => expect(stopButton).toBeDisabled());
    resolveFetch!();
    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalled();
      expect(stopButton).not.toBeDisabled();
    });
  });
});
