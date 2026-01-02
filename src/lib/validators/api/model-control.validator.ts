// src/lib/validators/api/model-control.validator.ts

import { z } from "zod";

/**
 * Start Model Request Schema
 */
export const startModelRequestSchema = z
  .object({
    model: z.string().min(1).describe("Name or ID of model to start"),
    template: z.string().optional().describe("Optional prompt template"),
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant", "system", "tool"]),
          content: z.string(),
        })
      )
      .optional()
      .describe("Optional initial messages"),
    max_tokens: z.number().int().positive().optional().describe("Max tokens to generate"),
  })
  .strict()
  .describe("Request to start/load a model");

/**
 * Start Model Response Schema
 */
export const startModelResponseSchema = z
  .object({
    model: z.string().describe("Name of the model"),
    status: z
      .enum(["loaded", "loading", "error", "not_found"])
      .describe("Current model status"),
    message: z.string().optional().describe("Human-readable status message"),
    data: z.unknown().optional().describe("Additional response data"),
  })
  .strict()
  .describe("Response from model start operation");

/**
 * Stop Model Request Schema
 */
export const stopModelRequestSchema = z
  .object({
    force: z.boolean().optional().default(false).describe("Force stop model process"),
  })
  .strict()
  .describe("Request to stop a model");

/**
 * Stop Model Response Schema
 */
export const stopModelResponseSchema = z
  .object({
    model: z.string().describe("Name of the model"),
    status: z.enum(["stopped", "note", "error"]).describe("Stop operation status"),
    message: z.string().optional().describe("Human-readable status message"),
    info: z.string().optional().describe("Additional information"),
  })
  .strict()
  .describe("Response from model stop operation");

// Types
export type StartModelRequest = z.infer<typeof startModelRequestSchema>;
export type StartModelResponse = z.infer<typeof startModelResponseSchema>;
export type StopModelRequest = z.infer<typeof stopModelRequestSchema>;
export type StopModelResponse = z.infer<typeof stopModelResponseSchema>;
