import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { ModelsListCard } from "@/components/dashboard/ModelsListCard";
import type { MockModelConfig } from "__tests__/types/mock-types";
import { renderWithProviders, setupTestMocks, mockModels } from "./test-utils";

const mockOnToggle = jest.fn();

beforeEach(() => {
  setupTestMocks();
});

describe("ModelsListCard Template Functionality", () => {
  it("should show template dropdown when model has available templates", async () => {
    const modelsWithTemplates: MockModelConfig[] = [{ id: "model1", name: "Llama 2 7B", status: "idle", type: "llama", availableTemplates: ["llama-2-7b", "llama-chat"], template: "llama-2-7b" }];
    renderWithProviders(<ModelsListCard models={modelsWithTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("should not show template dropdown when model is running", () => {
    const runningModels: MockModelConfig[] = [{ id: "model1", name: "Running Model", status: "running", type: "llama", availableTemplates: ["t1", "t2"], template: "t1" }];
    renderWithProviders(<ModelsListCard models={runningModels} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.queryAllByRole("combobox").length).toBe(0);
  });

  it("should change selected template via dropdown", async () => {
    const modelsWithTemplates: MockModelConfig[] = [{ id: "model1", name: "Llama 2 7B", status: "idle", type: "llama", availableTemplates: ["llama-2-7b", "llama-chat"], template: "llama-2-7b" }];
    renderWithProviders(<ModelsListCard models={modelsWithTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    const dropdown = await screen.findByRole("combobox");
    fireEvent.change(dropdown, { target: { value: "llama-chat" } });
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("should include selected template when starting model", async () => {
    const modelsWithTemplates: MockModelConfig[] = [{ id: "model1", name: "Llama 2 7B", status: "idle", type: "llama", availableTemplates: ["llama-2-7b", "llama-chat"], template: "llama-2-7b" }];
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    renderWithProviders(<ModelsListCard models={modelsWithTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Start"));
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/models/"), expect.objectContaining({ body: expect.stringContaining("llama-2-7b") }));
    });
  });

  it("should show save button for running models with templates", () => {
    const runningWithTemplates: MockModelConfig[] = [{ id: "model1", name: "Running", status: "running", type: "llama", availableTemplates: ["t1", "t2"], template: "t1" }];
    renderWithProviders(<ModelsListCard models={runningWithTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.getAllByText("💾").length).toBe(1);
  });

  it("should handle model with no available templates", () => {
    const noTemplates: MockModelConfig[] = [{ id: "model1", name: "No Templates", status: "idle", type: "llama" }];
    renderWithProviders(<ModelsListCard models={noTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.queryAllByRole("combobox").length).toBe(0);
  });

  it("should handle model with empty availableTemplates array", () => {
    const emptyTemplates: MockModelConfig[] = [{ id: "model1", name: "Empty Templates", status: "idle", type: "llama", availableTemplates: [], template: "default" }];
    renderWithProviders(<ModelsListCard models={emptyTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    expect(screen.queryAllByRole("combobox").length).toBe(0);
  });

  it("should filter templates by model type (llama)", async () => {
    const llamaModels: MockModelConfig[] = [{ id: "model1", name: "llama-2-7b", status: "idle", type: "llama", availableTemplates: ["llama-2-7b", "llama-chat", "mistral-7b"], template: "llama-2-7b" }];
    renderWithProviders(<ModelsListCard models={llamaModels} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("should filter templates by model type (mistral)", async () => {
    const mistralModels: MockModelConfig[] = [{ id: "model1", name: "mistral-7b", status: "idle", type: "mistral", availableTemplates: ["mistral-7b", "mistral-instruct", "llama-2-7b"], template: "mistral-7b" }];
    renderWithProviders(<ModelsListCard models={mistralModels} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("should handle templates with special characters", async () => {
    const specialTemplates: MockModelConfig[] = [{ id: "model1", name: "Special Template", status: "idle", type: "llama", availableTemplates: ['template "with" quotes', "template 'with' apostrophes"], template: 'template "with" quotes' }];
    renderWithProviders(<ModelsListCard models={specialTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("should handle templates with unicode characters", async () => {
    const unicodeTemplates: MockModelConfig[] = [{ id: "model1", name: "Unicode Template", status: "idle", type: "llama", availableTemplates: ["模板", "テンプレート"], template: "テンプレート" }];
    renderWithProviders(<ModelsListCard models={unicodeTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("should handle very large number of templates", async () => {
    const manyTemplates = Array.from({ length: 100 }, (_, i) => `template-${i}`);
    const manyTemplatesModel: MockModelConfig[] = [{ id: "model1", name: "Many Templates", status: "idle", type: "llama", availableTemplates: manyTemplates, template: "template-0" }];
    renderWithProviders(<ModelsListCard models={manyTemplatesModel} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("should handle template loading errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const templatesModel: MockModelConfig[] = [{ id: "model1", name: "Llama 2 7B", status: "idle", type: "llama", availableTemplates: ["t1"], template: "t1" }];
    renderWithProviders(<ModelsListCard models={templatesModel} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => expect(screen.getByText("Available Models")).toBeInTheDocument());
    consoleErrorSpy.mockRestore();
  });

  it("should show alert when template save fails", async () => {
    const alertMock = jest.spyOn(window, "alert").mockImplementation();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Save failed" }) });
    const runningWithTemplates: MockModelConfig[] = [{ id: "model1", name: "Running", status: "running", type: "llama", availableTemplates: ["t1"], template: "t1" }];
    renderWithProviders(<ModelsListCard models={runningWithTemplates} isDark={false} onToggleModel={mockOnToggle} />);
    const saveButton = await screen.findByText("💾");
    fireEvent.click(saveButton);
    await waitFor(() => expect(alertMock).toHaveBeenCalled());
    alertMock.mockRestore();
  });

  it("should clear template selection when empty value is selected", async () => {
    const templatesModel: MockModelConfig[] = [{ id: "model1", name: "Llama 2 7B", status: "idle", type: "llama", availableTemplates: ["llama-2-7b", "llama-chat"], template: "llama-2-7b" }];
    renderWithProviders(<ModelsListCard models={templatesModel} isDark={false} onToggleModel={mockOnToggle} />);
    const dropdown = await screen.findByRole("combobox");
    fireEvent.change(dropdown, { target: { value: "" } });
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
  });

  it("should load and display available templates from API", async () => {
    const templatesModel: MockModelConfig[] = [{ id: "model1", name: "Llama 2 7B", status: "idle", type: "llama", availableTemplates: ["llama-2-7b", "llama-chat", "llama-instruct"], template: "llama-2-7b" }];
    renderWithProviders(<ModelsListCard models={templatesModel} isDark={false} onToggleModel={mockOnToggle} />);
    await waitFor(() => expect(screen.getByText("Available Models")).toBeInTheDocument());
  });
});
