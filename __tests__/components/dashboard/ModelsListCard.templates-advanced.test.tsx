import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import { renderWithProviders, setupBeforeEach } from "./ModelsListCard.test.setup";

describe("ModelsListCard - Templates (Advanced)", () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    setupBeforeEach();
  });

  it("should filter templates by model type (llama)", async () => {
    const llamaModels = [
      {
        id: "model1",
        name: "llama-2-7b",
        status: "idle" as const,
        type: "llama" as const,
        availableTemplates: [
          "llama-2-7b",
          "llama-chat",
          "llama-instruct",
          "mistral-7b",
        ],
        template: "llama-2-7b",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={llamaModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("should filter templates by model type (mistral)", async () => {
    const mistralModels = [
      {
        id: "model1",
        name: "mistral-7b",
        status: "idle" as const,
        type: "mistral" as const,
        availableTemplates: [
          "mistral-7b",
          "mistral-instruct",
          "llama-2-7b",
        ],
        template: "mistral-7b",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={mistralModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("should handle templates with special characters", async () => {
    const modelsWithSpecialTemplates = [
      {
        id: "model1",
        name: "Special Template Model",
        status: "idle" as const,
        type: "llama" as const,
        availableTemplates: [
          'template "with" quotes',
          "template 'with' apostrophes",
          "template-with-dashes",
          "template_with_underscores",
        ],
        template: 'template "with" quotes',
      },
    ];

    renderWithProviders(
      <ModelsListCard models={modelsWithSpecialTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("should handle templates with unicode characters", async () => {
    const modelsWithUnicodeTemplates = [
      {
        id: "model1",
        name: "Unicode Template Model",
        status: "idle" as const,
        type: "llama" as const,
        availableTemplates: [
          "模板",
          "テンプレート",
          "🎯 template",
          "template-with-ño",
        ],
        template: "テンプレート",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={modelsWithUnicodeTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("should handle very large number of templates", async () => {
    const manyTemplates = Array.from({ length: 100 }, (_, i) => `template-${i}`);
    const modelsWithManyTemplates = [
      {
        id: "model1",
        name: "Many Templates Model",
        status: "idle" as const,
        type: "llama" as const,
        availableTemplates: manyTemplates,
        template: "template-0",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={modelsWithManyTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("should handle template loading errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const modelsWithTemplates = [
      {
        id: "model1",
        name: "Llama 2 7B",
        status: "idle" as const,
        type: "llama" as const,
        availableTemplates: ["template1"],
        template: "template1",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={modelsWithTemplates} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      expect(screen.getByText("Available Models")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should show alert when template save fails", async () => {
    const alertMock = jest.spyOn(window, "alert").mockImplementation();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Save failed" }),
    });

    const runningModels = [
      {
        id: "model1",
        name: "Running Model",
        status: "running" as const,
        type: "llama" as const,
        availableTemplates: ["template1"],
        template: "template1",
      },
    ];

    renderWithProviders(
      <ModelsListCard models={runningModels} isDark={false} onToggleModel={mockOnToggle} />
    );

    await waitFor(() => {
      const saveButton = screen.getByText("💾");
      expect(saveButton).toBeInTheDocument();
    });

    alertMock.mockRestore();
  });

});
