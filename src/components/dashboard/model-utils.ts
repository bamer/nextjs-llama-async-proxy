import { getModelTemplatesSync } from "@/lib/client-model-templates";

export const detectModelType = (modelName: string): "llama" | "mistral" | "other" => {
  const nameLower = modelName.toLowerCase();
  if (
    nameLower.includes("llama") ||
    nameLower.includes("codellama") ||
    nameLower.includes("gemma") ||
    nameLower.includes("granite")
  ) {
    return "llama";
  }
  if (
    nameLower.includes("mistral") ||
    nameLower.includes("qwen") ||
    nameLower.includes("nemotron") ||
    nameLower.includes("magnus") ||
    nameLower.includes("fluently")
  ) {
    return "mistral";
  }
  return "other";
};

export const getModelTypeTemplates = (modelType: "llama" | "mistral" | "other"): string[] => {
  const allTemplates = getModelTemplatesSync();
  const templateValues = Object.values(allTemplates) as string[];
  if (modelType === "other") {
    return templateValues;
  }
  return templateValues.filter(t => {
    const template = t.toLowerCase();
    if (modelType === "llama") {
      return (
        template.includes("llama") || template.includes("chat") || template.includes("instruct")
      );
    }
    return template.includes("mistral");
  });
};

export async function toggleModel(
  modelName: string,
  modelStatus: string,
  selectedTemplate?: string
): Promise<void> {
  if (modelStatus === "running") {
    await fetch(`/api/models/${encodeURIComponent(modelName)}/stop`, { method: "POST" });
  } else {
    const body: any = {};
    if (selectedTemplate) {
      body.template = selectedTemplate;
    }
    const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to start model");
  }
}
