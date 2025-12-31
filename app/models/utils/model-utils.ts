import { ModelConfig, ModelData } from "../types";

export function storeToDatabaseModel(
  storeModel: import("@/types").ModelConfig,
): Omit<ModelConfig, "id" | "created_at" | "updated_at"> {
  const typeMap: Record<
    "llama" | "mistral" | "other",
    "llama" | "gpt" | "mistrall" | "custom"
  > = {
    llama: "llama",
    mistral: "mistrall",
    other: "custom",
  };

  return {
    name: storeModel.name,
    type: typeMap[storeModel.type] || "llama",
    status:
      storeModel.status === "running" ||
      storeModel.status === "loading" ||
      storeModel.status === "error"
        ? storeModel.status
        : "stopped",
    ctx_size: (storeModel.parameters?.ctx_size as number) ?? 0,
    batch_size: (storeModel.parameters?.batch_size as number) ?? 2048,
    threads: (storeModel.parameters?.threads as number) ?? -1,
    model_path: (storeModel.parameters?.model_path as string) ?? undefined,
    model_url: (storeModel.parameters?.model_url as string) ?? undefined,
  };
}

export function storeToModelData(
  storeModel: import("@/types").ModelConfig,
): ModelData {
  const typeMap: Record<
    "llama" | "mistral" | "other",
    "llama" | "gpt" | "mistrall" | "custom"
  > = {
    llama: "llama",
    mistral: "mistrall",
    other: "custom",
  };

  return {
    id: parseInt(storeModel.id, 10),
    name: storeModel.name,
    type: typeMap[storeModel.type] || "llama",
    status:
      storeModel.status === "running" ||
      storeModel.status === "loading" ||
      storeModel.status === "error"
        ? storeModel.status
        : "stopped",
    ctx_size: (storeModel.parameters?.ctx_size as number) ?? 0,
    batch_size: (storeModel.parameters?.batch_size as number) ?? 2048,
    threads: (storeModel.parameters?.threads as number) ?? -1,
    model_path: (storeModel.parameters?.model_path as string) ?? undefined,
    model_url: (storeModel.parameters?.model_url as string) ?? undefined,
  };
}

export function formatFileSize(bytes: number | undefined | null): string {
  if (!bytes) return "Unknown";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function normalizeStatus(
  status:
    | string
    | { value?: string; args?: unknown; preset?: unknown }
    | unknown,
): string {
  if (typeof status === "string") {
    return status;
  }
  if (
    status &&
    typeof status === "object" &&
    "value" in status &&
    typeof status.value === "string"
  ) {
    return status.value;
  }
  return "idle";
}

export function getStatusColor(
  status:
    | string
    | { value?: string; args?: unknown; preset?: unknown }
    | unknown,
): "default" | "success" | "warning" | "error" {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case "running":
      return "success";
    case "loading":
      return "warning";
    case "error":
      return "error";
    default:
      return "default";
  }
}
