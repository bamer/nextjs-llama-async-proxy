// src/lib/validators/model-template.validator.ts

import { z } from "zod";

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
 * Parse and validate model template
 */
export function parseModelTemplate(data: unknown): ModelTemplate {
  return modelTemplateSchema.parse(data);
}

/**
 * Parse and validate model templates configuration
 */
export function parseModelTemplatesConfig(data: unknown): ModelTemplatesConfig {
  return modelTemplatesConfigSchema.parse(data);
}

/**
 * Parse and validate model template save request
 */
export function parseModelTemplateSaveRequest(data: unknown): ModelTemplateSaveRequest {
  return modelTemplateSaveRequestSchema.parse(data);
}

/**
 * Parse and validate model template response
 */
export function parseModelTemplateResponse(data: unknown): ModelTemplateResponse {
  return modelTemplateResponseSchema.parse(data);
}

/**
 * Safe parse model templates configuration
 */
export function safeParseModelTemplatesConfig(data: unknown) {
  return modelTemplatesConfigSchema.safeParse(data);
}

/**
 * Safe parse model template save request
 */
export function safeParseModelTemplateSaveRequest(data: unknown) {
  return modelTemplateSaveRequestSchema.safeParse(data);
}

// Types
export type ModelTemplate = z.infer<typeof modelTemplateSchema>;
export type ModelTemplatesConfig = z.infer<typeof modelTemplatesConfigSchema>;
export type ModelTemplateSaveRequest = z.infer<typeof modelTemplateSaveRequestSchema>;
export type ModelTemplateResponse = z.infer<typeof modelTemplateResponseSchema>;
