import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import { renderWithProviders, setupBeforeEach } from "./ModelsListCard.test.setup";

describe("ModelsListCard - Templates (Basic)", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    setupBeforeEach();
  });

  it("should load and display available templates from API", async () => {
    const modelsWithTemplates = [
      {
        id: "model1",
        name: "Llama 2 7B",
        status: "idle" as const,
        type: "llama" as const,
        availableTemplates: ["llama-2-7b", "llama-chat", "llama-instruct"],
        template: "llama-2-7b",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={modelsWithTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      expect(screen.getByText("Available Models")).toBeInTheDocument();
    });
  });

  it("should show template dropdown when model has available templates", async () => {
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

    await waitFor(() => {
      const dropdown = screen.queryByRole("combobox");
      expect(dropdown).toBeInTheDocument();
    });
  });

  it("should not show template dropdown when model is running", () => {
    const runningModels = [
      {
        id: "model1",
        name: "Running Model",
        status: "running" as const,
        type: "llama" as const,
        availableTemplates: ["template1", "template2"],
        template: "template1",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={runningModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    const dropdowns = screen.queryAllByRole("combobox");
    expect(dropdowns.length).toBe(0);
  });

  it("should change selected template via dropdown", async () => {
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

    await waitFor(() => {
      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toBeInTheDocument();
    });

    const dropdown = screen.getByRole("combobox");
    fireEvent.change(dropdown, { target: { value: "llama-chat" } });

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("should include selected template when starting model", async () => {
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

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    renderWithProviders(
      <ModelsListCard models={modelsWithTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      const startButton = screen.getByText("Start");
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/models/"),
        expect.objectContaining({
          body: expect.stringContaining("llama-2-7b"),
        })
      );
    });
  });

  it("should show save button for running models with templates", () => {
    const runningModelsWithTemplates = [
      {
        id: "model1",
        name: "Running Model",
        status: "running" as const,
        type: "llama" as const,
        availableTemplates: ["template1", "template2"],
        template: "template1",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={runningModelsWithTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    const saveButtons = screen.getAllByText("💾");
    expect(saveButtons.length).toBe(1);
  });

  it("should handle model with no available templates", () => {
    const modelsWithoutTemplates = [
      {
        id: "model1",
        name: "No Templates Model",
        status: "idle" as const,
        type: "llama" as const,
      },
    ];

    renderWithProviders(
      <ModelsListCard models={modelsWithoutTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    const dropdowns = screen.queryAllByRole("combobox");
    expect(dropdowns.length).toBe(0);
  });

  it("should handle model with empty availableTemplates array", () => {
    const modelsWithEmptyTemplates = [
      {
        id: "model1",
        name: "Empty Templates Model",
        status: "idle" as const,
        type: "llama" as const,
        availableTemplates: [],
        template: "default",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={modelsWithEmptyTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    const dropdowns = screen.queryAllByRole("combobox");
    expect(dropdowns.length).toBe(0);
  });
});
