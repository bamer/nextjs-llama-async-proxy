import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import { mockModels, renderWithProviders, setupBeforeEach } from "./ModelsListCard.test.setup";

describe("ModelsListCard - Edge Cases", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    setupBeforeEach();
  });

  it("handles empty models array gracefully", () => {
    renderWithProviders(
      <ModelsListCard models={[]} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(screen.getByText("0 models")).toBeInTheDocument();
  });

  it("handles null models", () => {
    renderWithProviders(
      <ModelsListCard models={null as unknown as any[]} isDark={false} onToggleModel={mockOnToggle} />
    );

    expect(screen.getByText("Available Models")).toBeInTheDocument();
  });

  it("handles undefined models", () => {
    renderWithProviders(
      <ModelsListCard models={undefined as unknown as any[]} isDark={false} onToggleModel={mockOnToggle} />
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

    const startButton = screen.getByText("Start");
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

  it("handles very large number of models", () => {
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

  it("handles null onToggleModel without crashing", () => {
    expect(() => {
      renderWithProviders(
        <ModelsListCard models={mockModels} isDark={false} onToggleModel={null as any} />
      );
    }).not.toThrow();
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

  it("handles template selection when empty value is selected", async () => {
    const modelsWithTemplates = [
      {
        id: "model1",
        name: "Llama 2 7B",
        status: "idle" as const,
        type: "llama" as const,
        availableTemplates: ["llama-2-7b", "llama-chat"],
        template: "llama-2-7b",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={modelsWithTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    const dropdown = screen.getByRole("combobox");
    fireEvent.change(dropdown, { target: { value: "" } });

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });
});
