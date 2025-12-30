import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoizedModelItem, detectModelType, getModelTypeTemplates } from "@/components/dashboard/MemoizedModelItem";

// Mock dependencies
jest.mock("@/lib/client-model-templates", () => ({
  getModelTemplatesSync: jest.fn(() => ({
    "llama-2-7b": "llama-2-7b",
    "mistral-7b": "mistral-7b",
    "codellama-7b": "codellama-7b",
    "chat-template": "chat-template",
    "instruct-template": "instruct-template"
  }))
}));

describe("MemoizedModelItem", () => {
  describe("Utility Functions", () => {
    describe("detectModelType", () => {
      it("should detect llama models", () => {
        expect(detectModelType("llama-2-7b")).toBe("llama");
        expect(detectModelType("codellama-7b")).toBe("llama");
        expect(detectModelType("gemma-7b")).toBe("llama");
        expect(detectModelType("granite-3b")).toBe("llama");
      });

      it("should detect mistral models", () => {
        expect(detectModelType("mistral-7b")).toBe("mistral");
        expect(detectModelType("qwen-7b")).toBe("mistral");
        expect(detectModelType("nemotron-4b")).toBe("mistral");
        expect(detectModelType("magnus-7b")).toBe("mistral");
        expect(detectModelType("fluently-7b")).toBe("mistral");
      });

      it("should detect other models", () => {
        expect(detectModelType("some-other-model")).toBe("other");
        expect(detectModelType("random-model")).toBe("other");
      });

      it("should be case insensitive", () => {
        expect(detectModelType("LLAMA-2-7B")).toBe("llama");
        expect(detectModelType("Mistral-7B")).toBe("mistral");
      });
    });

    describe("getModelTypeTemplates", () => {
      it("should return all templates for other models", () => {
        const templates = getModelTypeTemplates("other");
        expect(templates).toEqual(["llama-2-7b", "mistral-7b", "codellama-7b", "chat-template", "instruct-template"]);
      });

      it("should filter llama templates for llama models", () => {
        const templates = getModelTypeTemplates("llama");
        expect(templates).toContain("llama-2-7b");
        expect(templates).toContain("codellama-7b");
        expect(templates).toContain("chat-template");
        expect(templates).toContain("instruct-template");
        expect(templates).not.toContain("mistral-7b");
      });

      it("should filter mistral templates for mistral models", () => {
        const templates = getModelTypeTemplates("mistral");
        expect(templates).toContain("mistral-7b");
        expect(templates).not.toContain("llama-2-7b");
        expect(templates).not.toContain("codellama-7b");
      });
    });
  });

  describe("Component Integration", () => {
    const defaultProps = {
      model: {
        id: "model-1",
        name: "llama-2-7b",
        status: "idle" as const,
        type: "llama" as const
      },
      isDark: false,
      currentTemplate: "",
      loadingModels: {},
      setLoadingModels: jest.fn(),
      selectedTemplates: {},
      onSaveTemplate: jest.fn(),
      onSaveTemplateToConfig: jest.fn(),
      onToggleModel: jest.fn()
    };

    it("should render model name", () => {
      render(<MemoizedModelItem {...defaultProps} />);
      expect(screen.getByText("llama-2-7b")).toBeInTheDocument();
    });

    it("should render start button for idle model", () => {
      render(<MemoizedModelItem {...defaultProps} />);
      expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
    });

    it("should render stop button for running model", () => {
      const runningModel = {
        ...defaultProps.model,
        status: "running" as const
      };

      render(<MemoizedModelItem {...defaultProps} model={runningModel} />);
      expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    });

    it("should show template selector for idle models with templates", () => {
      const modelWithTemplates = {
        ...defaultProps.model,
        availableTemplates: ["template1", "template2"]
      };

      render(<MemoizedModelItem {...defaultProps} model={modelWithTemplates} />);
      expect(screen.getByLabelText("Template")).toBeInTheDocument();
    });

    it("should not show template selector for running models", () => {
      const runningModel = {
        ...defaultProps.model,
        status: "running" as const,
        availableTemplates: ["template1", "template2"]
      };

      render(<MemoizedModelItem {...defaultProps} model={runningModel} />);
      expect(screen.queryByLabelText("Template")).not.toBeInTheDocument();
    });

    it("should show save template button for running models with templates", () => {
      const runningModel = {
        ...defaultProps.model,
        status: "running" as const,
        availableTemplates: ["template1", "template2"]
      };

      render(<MemoizedModelItem {...defaultProps} model={runningModel} />);
      expect(screen.getByRole("button", { name: /💾/i })).toBeInTheDocument();
    });

    it("should not show save template button for idle models", () => {
      render(<MemoizedModelItem {...defaultProps} />);
      expect(screen.queryByRole("button", { name: /💾/i })).not.toBeInTheDocument();
    });
  });
});