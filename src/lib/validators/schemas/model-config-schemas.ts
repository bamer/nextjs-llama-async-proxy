// src/lib/validators/schemas/model-config-schemas.ts

import { z } from "zod";

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
    id: z.string().min(1).describe("Unique identifier for the model"),
    name: z.string().min(1).describe("Human-readable model name"),
    size: z.number().nonnegative().describe("Model file size in bytes"),
    type: z.string().min(1).describe("Model type (e.g., 'gguf', 'bin')"),
    modified_at: z.number().int().describe("Unix timestamp of last modification"),
    path: z.string().min(1).describe("Full file path to the model"),
    availableTemplates: z.array(z.string()).optional().describe("List of available prompt templates"),
    template: z.string().optional().describe("Currently selected template"),
  })
  .strict()
  .describe("Llama model information");

/**
 * Model Configuration Schema
 * Validates full model configuration
 */
export const modelConfigSchema = z
  .object({
    id: z.string().min(1).describe("Unique model identifier"),
    name: z.string().min(1).describe("Model name"),
    type: z.enum(["llama", "mistral", "other"]).describe("Model architecture type"),
    parameters: z.record(z.string(), z.unknown()).describe("Model-specific parameters"),
    status: modelStatusSchema,
    createdAt: z.string().datetime().describe("ISO timestamp of model creation"),
    updatedAt: z.string().datetime().describe("ISO timestamp of last update"),
    template: z.string().optional().describe("Selected prompt template"),
    availableTemplates: z.array(z.string()).optional().describe("Available templates for this model"),
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
    model_templates: z.record(z.string(), z.string().min(1).optional()).optional().describe("Record of model templates with string template names"),
    default_model: z.string().nullable().optional().describe("Default model template name"),
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
    modelId: z.string().min(1).describe("Model identifier"),
    oldStatus: modelStatusSchema,
    newStatus: modelStatusSchema,
    timestamp: z.string().datetime().describe("ISO timestamp of status change"),
    error: z.string().optional().describe("Error message if status is 'error'"),
  })
  .strict()
  .describe("Model status update event");
