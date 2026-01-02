import type { ModelConfig } from "@/types";

/**
 * Utility functions for model operations
 * Provides helper functions for common model CRUD operations
 */

/**
 * Parse model ID to database ID (numeric)
 * @param modelId - String model ID
 * @returns Numeric database ID or NaN if invalid
 */
export function parseModelIdToDbId(modelId: string): number {
  return parseInt(modelId, 10);
}

/**
 * Check if model ID is valid (can be parsed to number)
 * @param modelId - String model ID
 * @returns True if valid, false otherwise
 */
export function isValidDbId(modelId: string): boolean {
  return !isNaN(parseModelIdToDbId(modelId));
}

/**
 * Create a new model configuration from partial config
 * @param config - Partial model configuration
 * @returns Complete ModelConfig object
 */
export function createNewModel(
  config: Partial<ModelConfig>,
): ModelConfig {
  return {
    id: Date.now().toString(),
    name: config.name || "",
    type: config.type || "llama",
    parameters: config.parameters || {},
    status: "idle",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert model type to database type
 * @param type - Frontend model type
 * @returns Database model type string
 */
export function convertModelTypeToDbType(
  type: ModelConfig["type"],
): string {
  if (type === "mistral") {
    return "mistrall";
  }
  if (type === "other") {
    return "custom";
  }
  return type;
}

/**
 * Extract numeric parameter with default value
 * @param params - Parameters object
 * @param key - Parameter key
 * @param defaultValue - Default value if not found
 * @returns Numeric value or default
 */
export function getNumericParameter(
  params: Record<string, unknown>,
  key: string,
  defaultValue: number,
): number {
  const value = params[key];
  return typeof value === "number" ? value : defaultValue;
}

/**
 * Extract string parameter with optional default
 * @param params - Parameters object
 * @param key - Parameter key
 * @returns String value or undefined
 */
export function getStringParameter(
  params: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}
