import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import { mockModels, renderWithProviders, setupBeforeEach } from "./ModelsListCard.test.setup";

describe("ModelsListCard - User Interactions", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    setupBeforeEach();
  });

  it("calls onToggleModel when stopping a running model", async () => {
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

    const startButton = screen.getByText("Start");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledWith("model2");
    });
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

    await waitFor(() => {
      expect(stopButton).toBeDisabled();
    });

    resolveFetch!();
    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalled();
      expect(stopButton).not.toBeDisabled();
    });
  });

  it("handles rapid button clicks without errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    renderWithProviders(
      <ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    const stopButton = screen.getByText("Stop");

    for (let i = 0; i < 5; i++) {
      fireEvent.click(stopButton);
    }

    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalled();
    });
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
});
