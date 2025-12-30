// src/lib/validators/model-config.validator.ts

import { z } from "zod";

// ============================================================================
// Model State Schemas
// ============================================================================

/**
 * Model Status Enum
 * Valid status values for model state
 */
export const modelStatusSchema = z.enum([
  "idle",
  "loading",
  "running",
  "stopping",
  "error",
]).describe("Current status of a model");

/**
 * Llama Model Schema
 * Validates model information from llama-server
 */
export const llamaModelSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Unique identifier for the model"),
    name: z
      .string()
      .min(1)
      .describe("Human-readable model name"),
    size: z
      .number()
      .nonnegative()
      .describe("Model file size in bytes"),
    type: z
      .string()
      .min(1)
      .describe("Model type (e.g., 'gguf', 'bin')"),
    modified_at: z
      .number()
      .int()
      .describe("Unix timestamp of last modification"),
    path: z
      .string()
      .min(1)
      .describe("Full file path to the model"),
    availableTemplates: z
      .array(z.string())
      .optional()
      .describe("List of available prompt templates"),
    template: z
      .string()
      .optional()
      .describe("Currently selected template"),
  })
  .strict()
  .describe("Llama model information");

/**
 * Model Configuration Schema
 * Validates full model configuration
 */
export const modelConfigSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Unique model identifier"),
    name: z
      .string()
      .min(1)
      .describe("Model name"),
    type: z
      .enum(["llama", "mistral", "other"])
      .describe("Model architecture type"),
      parameters: z
      .record(z.string(), z.unknown())
      .describe("Model-specific parameters"),
    status: modelStatusSchema,
    createdAt: z
      .string()
      .datetime()
      .describe("ISO timestamp of model creation"),
    updatedAt: z
      .string()
      .datetime()
      .describe("ISO timestamp of last update"),
    template: z
      .string()
      .optional()
      .describe("Selected prompt template"),
    availableTemplates: z
      .array(z.string())
      .optional()
      .describe("Available templates for this model"),
  })
  .strict()
  .describe("Complete model configuration");

/**
 * Model Template Schema
 * Validates individual model template entries
 */
export const modelTemplateSchema = z
  .object({
    name: z.string().min(1).describe("Template name identifier"),
    template: z.string().min(1).describe("Template value/pattern"),
  })
  .strict()
  .describe("Individual model template");

/**
 * Model Templates Configuration Schema
 * Validates the complete model templates configuration structure
 */
export const modelTemplatesConfigSchema = z
  .object({
    model_templates: z
      .record(z.string(), z.string().min(1).optional())
      .optional()
      .describe("Record of model templates with string template names"),
    default_model: z
      .string()
      .nullable()
      .optional()
      .describe("Default model template name"),
  })
  .strict()
  .describe("Model templates configuration");

/**
 * Model Template Save Request Schema
 * Validates requests to save model templates
 */
export const modelTemplateSaveRequestSchema = z
  .object({
    model_templates: z.record(z.string(), z.string().min(1)).describe("Templates to save"),
  })
  .strict()
  .describe("Request to save model templates");

/**
 * Model Template Response Schema
 * Validates API responses containing model templates
 */
export const modelTemplateResponseSchema = z
  .object({
    model_templates: z.record(z.string(), z.string().min(1)).describe("Loaded templates"),
    message: z.string().optional().describe("Response message"),
  })
  .strict()
  .describe("Response containing model templates");

/**
 * Model Status Update Schema
 * Validates model status change events
 */
export const modelStatusUpdateSchema = z
  .object({
    modelId: z
      .string()
      .min(1)
      .describe("Model identifier"),
    oldStatus: modelStatusSchema,
    newStatus: modelStatusSchema,
    timestamp: z
      .string()
      .datetime()
      .describe("ISO timestamp of status change"),
    error: z
      .string()
      .optional()
      .describe("Error message if status is 'error'"),
  })
  .strict()
  .describe("Model status update event");

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse and validate model data
 * @param data - Raw model data
 * @returns Parsed and validated model
 * @throws ZodError if validation fails
 */
export function parseLlamaModel(data: unknown): LlamaModel {
  return llamaModelSchema.parse(data);
}

/**
 * Parse and validate model template
 * @param data - Raw model template data
 * @returns Parsed and validated template
 * @throws ZodError if validation fails
 */
export function parseModelTemplate(data: unknown): ModelTemplate {
  return modelTemplateSchema.parse(data);
}

/**
 * Parse and validate model templates configuration
 * @param data - Raw templates configuration data
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export function parseModelTemplatesConfig(data: unknown): ModelTemplatesConfig {
  return modelTemplatesConfigSchema.parse(data);
}

/**
 * Parse and validate model template save request
 * @param data - Raw save request data
 * @returns Parsed and validated request
 * @throws ZodError if validation fails
 */
export function parseModelTemplateSaveRequest(data: unknown): ModelTemplateSaveRequest {
  return modelTemplateSaveRequestSchema.parse(data);
}

/**
 * Parse and validate model template response
 * @param data - Raw response data
 * @returns Parsed and validated response
 * @throws ZodError if validation fails
 */
export function parseModelTemplateResponse(data: unknown): ModelTemplateResponse {
  return modelTemplateResponseSchema.parse(data);
}

/**
 * Safe parse model templates configuration
 * @param data - Raw templates configuration data
 * @returns Zod parse result
 */
export function safeParseModelTemplatesConfig(data: unknown) {
  return modelTemplatesConfigSchema.safeParse(data);
}

/**
 * Safe parse model template save request
 * @param data - Raw save request data
 * @returns Zod parse result
 */
export function safeParseModelTemplateSaveRequest(data: unknown) {
  return modelTemplateSaveRequestSchema.safeParse(data);
}

// ============================================================================
// Types
// ============================================================================

export type ModelStatus = z.infer<typeof modelStatusSchema>;
export type LlamaModel = z.infer<typeof llamaModelSchema>;
export type ModelConfig = z.infer<typeof modelConfigSchema>;
export type ModelTemplate = z.infer<typeof modelTemplateSchema>;
export type ModelTemplatesConfig = z.infer<typeof modelTemplatesConfigSchema>;
export type ModelTemplateSaveRequest = z.infer<typeof modelTemplateSaveRequestSchema>;
export type ModelTemplateResponse = z.infer<typeof modelTemplateResponseSchema>;
export type ModelStatusUpdate = z.infer<typeof modelStatusUpdateSchema>;
