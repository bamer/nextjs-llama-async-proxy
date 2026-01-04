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

describe("ModelsListCard Negative Tests", () => {
  it("handles empty models array gracefully", () => {
    renderWithProviders(<ModelsListCard models={[]} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("0 models")).toBeInTheDocument();
  });

  it("handles null models", () => {
    renderWithProviders(<ModelsListCard models={null as unknown as MockModelConfig[]} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Available Models")).toBeInTheDocument();
  });

  it("handles undefined models", () => {
    renderWithProviders(<ModelsListCard models={undefined as unknown as MockModelConfig[]} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Available Models")).toBeInTheDocument();
  });

  it("handles API error when starting model", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Failed to start model" }) });
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    fireEvent.click(screen.getAllByText("Start")[0]);
    await waitFor(() => expect(alertMock).toHaveBeenCalledWith("Failed to start model"));
    alertMock.mockRestore();
  });

  it("handles API error when stopping model", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation(() => {});
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    fireEvent.click(screen.getByText("Stop"));
    await waitFor(() => expect(consoleErrorMock).toHaveBeenCalled());
    consoleErrorMock.mockRestore();
    alertMock.mockRestore();
  });

  it("disables button during loading state", async () => {
    renderWithProviders(<ModelsListCard models={loadingModels} isDark={false} onToggleModel={mockOnToggle} />);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(screen.getByText("Start").closest("button")).toBeDisabled();
  });

  it("handles very large number of models", () => {
    const manyModels: MockModelConfig[] = Array.from({ length: 100 }, (_, i) => ({
      id: `model${i}`, name: `Model ${i}`, status: i % 2 === 0 ? "running" : "idle", type: "llama",
    }));
    renderWithProviders(<ModelsListCard models={manyModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("100 models")).toBeInTheDocument();
  });

  it("handles model with special characters in name", () => {
    const specialCharModels: MockModelConfig[] = [{ id: "model1", name: 'Model-α_β 🚀 & "test"', status: "running", type: "llama" }];
    renderWithProviders(<ModelsListCard models={specialCharModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText('Model-α_β 🚀 & "test"')).toBeInTheDocument();
  });

  it("handles model with empty name", () => {
    const emptyNameModels: MockModelConfig[] = [{ id: "model1", name: "", status: "running", type: "llama" }];
    renderWithProviders(<ModelsListCard models={emptyNameModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("1 models")).toBeInTheDocument();
  });

  it("handles model without progress in loading state", () => {
    const noProgressModels: MockModelConfig[] = [{ id: "model1", name: "No Progress Model", status: "loading", type: "llama" }];
    renderWithProviders(<ModelsListCard models={noProgressModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("LOADING")).toBeInTheDocument();
  });

  it("handles null onToggleModel without crashing", () => {
    const NoopOnToggle = jest.fn(() => { throw new Error("Should not be called"); });
    expect(() => {
      renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={NoopOnToggle} />);
    }).not.toThrow();
  });

  it("handles rapid button clicks without errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    renderWithProviders(<ModelsListCard models={mockModels} isDark={false} onToggleModel={mockOnToggle} />);
    const stopButton = screen.getByText("Stop");
    for (let i = 0; i < 5; i++) { fireEvent.click(stopButton); }
    await waitFor(() => expect(mockOnToggle).toHaveBeenCalled());
  });

  it("handles models with duplicate names but different IDs", () => {
    const duplicateNameModels: MockModelConfig[] = [
      { id: "model1", name: "Same Name", status: "running", type: "llama" },
      { id: "model2", name: "Same Name", status: "idle", type: "mistral" },
    ];
    renderWithProviders(<ModelsListCard models={duplicateNameModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getAllByText("Same Name").length).toBe(2);
  });

  it("handles progress at boundaries (0% and 100%)", () => {
    const boundaryModels: MockModelConfig[] = [
      { id: "model1", name: "0% Progress", status: "loading", type: "llama", progress: 0 },
      { id: "model2", name: "100% Progress", status: "loading", type: "mistral", progress: 100 },
    ];
    renderWithProviders(<ModelsListCard models={boundaryModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getByText("Loading... 0%")).toBeInTheDocument();
    expect(screen.getByText("Loading... 100%")).toBeInTheDocument();
  });
});
