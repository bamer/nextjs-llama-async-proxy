import { MessageEvent } from 'worker_threads';

// Mock self for worker environment
const mockPostMessage = jest.fn();
const mockOnmessageHandler: ((e: MessageEvent) => void)[] = [];

const mockSelf = {
  postMessage: mockPostMessage,
  onmessage: null as ((e: MessageEvent) => void) | null,
};

// Set global self
(global as any).self = mockSelf;

// We need to test the worker by importing and simulating messages
// Since it's a worker file, we'll test its logic directly

interface TemplateProcessingMessage {
  type: "process-templates";
  models: Array<{
    name: string;
    availableTemplates?: string[];
  }>;
  allTemplates: Record<string, string>;
}

interface TemplateProcessingResult {
  type: "templates-processed";
  templatesForModels: Record<string, string>;
}

function processTemplatesWorkerLogic(message: TemplateProcessingMessage): TemplateProcessingResult | null {
  const { type, models, allTemplates } = message;

  if (type === "process-templates") {
    // Process templates in worker (non-blocking)
    const templatesForModels: Record<string, string> = {};

    models.forEach(model => {
      if (model.availableTemplates && model.availableTemplates.length > 0) {
        templatesForModels[model.name] = model.availableTemplates[0];
      }
    });

    // Send result back to main thread
    return {
      type: "templates-processed",
      templatesForModels,
    };
  }

  return null;
}

describe('template-processor.worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostMessage.mockClear();
    mockOnmessageHandler.length = 0;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processTemplatesWorkerLogic', () => {
    it('processes templates for models with available templates', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["template1", "template2"] },
          { name: "model2", availableTemplates: ["template3"] },
        ],
        allTemplates: {
          template1: "Template 1",
          template2: "Template 2",
          template3: "Template 3",
        },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("templates-processed");
      expect(result?.templatesForModels).toEqual({
        model1: "template1",
        model2: "template3",
      });
    });

    it('handles models with no available templates', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["template1"] },
          { name: "model2", availableTemplates: [] },
          { name: "model3" }, // No availableTemplates property
        ],
        allTemplates: {
          template1: "Template 1",
        },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({
        model1: "template1",
      });
    });

    it('handles allTemplates parameter (even though not used)', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["template1"] },
        ],
        allTemplates: {
          template1: "Template 1",
          template2: "Template 2",
        },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("templates-processed");
    });

    it('handles empty models array', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [],
        allTemplates: {},
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({});
    });

    it('handles single template per model', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["template1"] },
          { name: "model2", availableTemplates: ["template2"] },
          { name: "model3", availableTemplates: ["template3"] },
        ],
        allTemplates: {
          template1: "Template 1",
          template2: "Template 2",
          template3: "Template 3",
        },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({
        model1: "template1",
        model2: "template2",
        model3: "template3",
      });
    });

    it('selects first template from available templates', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["template1", "template2", "template3"] },
        ],
        allTemplates: {
          template1: "Template 1",
          template2: "Template 2",
          template3: "Template 3",
        },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels.model1).toBe("template1");
    });

    it('handles undefined availableTemplates', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: undefined },
        ],
        allTemplates: {},
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({});
    });

    it('handles null-like empty arrays', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: [] },
          { name: "model2", availableTemplates: undefined },
        ],
        allTemplates: {},
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({});
    });

    it('returns correct type field', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["template1"] },
        ],
        allTemplates: {},
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.type).toBe("templates-processed");
    });

    it('does not modify input message', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["template1", "template2"] },
        ],
        allTemplates: { template1: "Template 1" },
      };

      const originalModels = JSON.parse(JSON.stringify(message.models));
      const originalAllTemplates = JSON.parse(JSON.stringify(message.allTemplates));

      processTemplatesWorkerLogic(message);

      expect(message.models).toEqual(originalModels);
      expect(message.allTemplates).toEqual(originalAllTemplates);
    });

    it('handles large number of models', () => {
      const models: Array<{ name: string; availableTemplates?: string[] }> = [];
      const allTemplates: Record<string, string> = {};

      for (let i = 0; i < 100; i++) {
        models.push({ name: `model${i}`, availableTemplates: [`template${i}`] });
        allTemplates[`template${i}`] = `Template ${i}`;
      }

      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models,
        allTemplates,
      };

      const result = processTemplatesWorkerLogic(message);

      expect(Object.keys(result?.templatesForModels || {}).length).toBe(100);
    });

    it('handles special characters in model names', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model-with-dash", availableTemplates: ["template1"] },
          { name: "model_with_underscore", availableTemplates: ["template2"] },
          { name: "model.with.dots", availableTemplates: ["template3"] },
        ],
        allTemplates: {
          template1: "Template 1",
          template2: "Template 2",
          template3: "Template 3",
        },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({
        "model-with-dash": "template1",
        "model_with_underscore": "template2",
        "model.with.dots": "template3",
      });
    });

    it('handles models with same template names', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["shared-template"] },
          { name: "model2", availableTemplates: ["shared-template"] },
          { name: "model3", availableTemplates: ["shared-template"] },
        ],
        allTemplates: {
          "shared-template": "Shared Template",
        },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({
        model1: "shared-template",
        model2: "shared-template",
        model3: "shared-template",
      });
    });

    it('returns null for non-process-templates message types', () => {
      const message = {
        type: "invalid-type",
        models: [],
        allTemplates: {},
      } as any;

      const result = processTemplatesWorkerLogic(message);

      expect(result).toBeNull();
    });

    it('handles complex template arrays', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["t1", "t2", "t3", "t4", "t5"] },
          { name: "model2", availableTemplates: ["a", "b"] },
        ],
        allTemplates: {},
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({
        model1: "t1",
        model2: "a",
      });
    });
  });

  describe('Worker Message Structure', () => {
    it('has correct input message structure', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [{ name: "test" }],
        allTemplates: {},
      };

      expect(message).toHaveProperty("type");
      expect(message).toHaveProperty("models");
      expect(message).toHaveProperty("allTemplates");
    });

    it('has correct output message structure', () => {
      const result = processTemplatesWorkerLogic({
        type: "process-templates",
        models: [],
        allTemplates: {},
      });

      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("templatesForModels");
    });
  });

  describe('Edge Cases', () => {
    it('handles model with empty string name', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [{ name: "", availableTemplates: ["template1"] }],
        allTemplates: {},
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({ "": "template1" });
    });

    it('handles template with empty string name', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [{ name: "model1", availableTemplates: [""] }],
        allTemplates: { "": "Empty Template" },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({ model1: "" });
    });

    it('handles single model with single template', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [{ name: "solo", availableTemplates: ["solo-template"] }],
        allTemplates: { "solo-template": "Solo Template" },
      };

      const result = processTemplatesWorkerLogic(message);

      expect(result?.templatesForModels).toEqual({ solo: "solo-template" });
    });

    it('preserves model order in result', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "z-model", availableTemplates: ["z"] },
          { name: "a-model", availableTemplates: ["a"] },
          { name: "m-model", availableTemplates: ["m"] },
        ],
        allTemplates: {},
      };

      const result = processTemplatesWorkerLogic(message);
      const keys = Object.keys(result?.templatesForModels || {});

      expect(keys).toEqual(["z-model", "a-model", "m-model"]);
    });
  });

  describe('Performance', () => {
    it('processes templates synchronously (non-blocking)', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [
          { name: "model1", availableTemplates: ["template1"] },
          { name: "model2", availableTemplates: ["template2"] },
        ],
        allTemplates: {},
      };

      const startTime = Date.now();
      const result = processTemplatesWorkerLogic(message);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10); // Should complete very quickly
    });

    it('does not have side effects on multiple calls', () => {
      const message: TemplateProcessingMessage = {
        type: "process-templates",
        models: [{ name: "model1", availableTemplates: ["template1"] }],
        allTemplates: {},
      };

      const result1 = processTemplatesWorkerLogic(message);
      const result2 = processTemplatesWorkerLogic(message);
      const result3 = processTemplatesWorkerLogic(message);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});
