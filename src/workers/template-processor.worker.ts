"use client";

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

export default () => {
  self.onmessage = (e: MessageEvent<TemplateProcessingMessage>) => {
    const { type, models, allTemplates } = e.data;

    if (type === "process-templates") {
      // Process templates in worker (non-blocking)
      const templatesForModels: Record<string, string> = {};

      models.forEach(model => {
        if (model.availableTemplates && model.availableTemplates.length > 0) {
          templatesForModels[model.name] = model.availableTemplates[0];
        }
      });

      // Send result back to main thread
      self.postMessage({
        type: "templates-processed",
        templatesForModels,
      } as TemplateProcessingResult);
    }
  };
};
