// src/lib/validators/schemas/api-request-schemas.ts

import { z } from "zod";

/**
 * Start Model Request Schema
 */
export const startModelRequestSchema = z
  .object({
    model: z.string().min(1).describe("Name or ID of model to start"),
    template: z.string().optional().describe("Optional prompt template"),
    messages: z.array(
      z.object({
        role: z.enum(["user", "assistant", "system", "tool"]),
        content: z.string(),
      })
    ).optional().describe("Optional initial messages"),
    max_tokens: z.number().int().positive().optional().describe("Max tokens to generate"),
  })
  .strict()
  .describe("Request to start/load a model");

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
 * Rescan Request Schema
 */
export const rescanRequestSchema = z
  .object({
    host: z.string().optional(),
    port: z.union([z.number().int(), z.string()]).optional(),
    modelsPath: z.string().optional(),
    llamaServerPath: z.string().optional(),
    ctx_size: z.number().int().optional(),
    batch_size: z.number().int().optional(),
    threads: z.number().int().optional(),
    gpu_layers: z.number().int().optional(),
  })
  .strict()
  .describe("Rescan models request");

/**
 * Logger Config Request Schema
 */
export const loggerConfigRequestSchema = z
  .object({
    level: z.enum(["error", "warn", "info", "debug"]).optional(),
    enableConsole: z.boolean().optional(),
    enableFile: z.boolean().optional(),
  })
  .strict()
  .describe("Logger configuration request");

// Types
export type StartModelRequest = z.infer<typeof startModelRequestSchema>;
export type StopModelRequest = z.infer<typeof stopModelRequestSchema>;
export type RescanRequest = z.infer<typeof rescanRequestSchema>;
export type LoggerConfigRequest = z.infer<typeof loggerConfigRequestSchema>;

// Parser Functions
export function parseStartModelRequest(data: unknown): StartModelRequest {
  return startModelRequestSchema.parse(data);
}

export function parseStopModelRequest(data: unknown): StopModelRequest {
  return stopModelRequestSchema.parse(data);
}
