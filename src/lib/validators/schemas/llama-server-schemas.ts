// src/lib/validators/schemas/llama-server-schemas.ts

import { z } from "zod";

/**
 * Llama Server Configuration Schema
 * Validates the llama-server configuration from llama-server-config.json
 */
export const llamaServerConfigSchema = z
  .object({
    host: z
      .string()
      .min(1)
      .max(253)
      .describe("Server hostname or IP address"),
    port: z
      .number()
      .int()
      .min(1)
      .max(65535)
      .describe("Server port number (1-65535)"),
    basePath: z
      .string()
      .min(1)
      .describe("Base path where models are stored"),
    serverPath: z
      .string()
      .min(1)
      .describe("Full path to llama-server binary"),
    ctx_size: z
      .number()
      .int()
      .min(0)
      .describe("Context size in tokens (0 for auto)"),
    batch_size: z
      .number()
      .int()
      .min(1)
      .max(8192)
      .describe("Batch size for prompt processing"),
    threads: z
      .number()
      .int()
      .min(-1)
      .default(-1)
      .describe("Number of threads (-1 for auto)"),
    gpu_layers: z
      .number()
      .int()
      .min(-1)
      .default(-1)
      .describe("Number of GPU layers (-1 for all)"),
    autoStart: z
      .boolean()
      .default(false)
      .describe("Automatically start llama-server on application startup"),
  })
  .strict()
  .describe("Llama server configuration settings");

/**
 * Extended Llama Server Configuration Schema
 * Full configuration with all optional parameters from LlamaService
 */
export const llamaServerConfigExtendedSchema = z
  .object({
    host: z.string().min(1).max(253),
    port: z.number().int().min(1).max(65535),
    modelPath: z.string().optional().describe("Optional specific model file path"),
    basePath: z.string().optional().describe("Path where models are stored for discovery"),
    serverPath: z.string().optional().describe("Full path to llama-server binary"),
    serverArgs: z.array(z.string()).optional().describe("Additional server arguments"),
    ctx_size: z.number().int().min(0).optional(),
    batch_size: z.number().int().min(1).max(8192).optional(),
    ubatch_size: z.number().int().min(1).optional(),
    threads: z.number().int().min(-1).optional(),
    threads_batch: z.number().int().min(-1).optional(),
    gpu_layers: z.number().int().min(-1).optional(),
    main_gpu: z.number().int().min(0).optional(),
    flash_attn: z.enum(["on", "off", "auto"]).optional(),
    n_predict: z.number().int().min(-1).optional(),
    temperature: z.number().min(0).optional(),
    top_k: z.number().int().min(0).optional(),
    top_p: z.number().min(0).max(1).optional(),
    repeat_penalty: z.number().min(0).optional(),
    seed: z.number().int().min(-1).optional(),
    verbose: z.boolean().optional(),
    embedding: z.boolean().optional(),
    cache_type_k: z.string().optional(),
    cache_type_v: z.string().optional(),
  })
  .passthrough()
  .describe("Extended llama server configuration with all optional parameters");

/**
 * Llama Server Settings Schema
 * Validates llama-server configuration form
 */
export const llamaServerSettingsSchema = z
  .object({
    host: z
      .string()
      .min(1)
      .max(253)
      .describe("Server hostname or IP"),
    port: z
      .number()
      .int()
      .min(1)
      .max(65535)
      .describe("Server port"),
    basePath: z
      .string()
      .min(1)
      .describe("Models base path"),
    serverPath: z
      .string()
      .min(1)
      .describe("Server binary path"),
    ctx_size: z
      .number()
      .int()
      .min(0)
      .describe("Context size in tokens"),
    batch_size: z
      .number()
      .int()
      .min(1)
      .max(8192)
      .describe("Batch size"),
    threads: z
      .number()
      .int()
      .min(-1)
      .describe("Number of threads"),
    gpu_layers: z
      .number()
      .int()
      .min(-1)
      .describe("GPU layers"),
  })
  .strict()
  .describe("Llama server settings form data");

// Types
export type LlamaServerConfig = z.infer<typeof llamaServerConfigSchema>;
export type LlamaServerConfigExtended = z.infer<typeof llamaServerConfigExtendedSchema>;
export type LlamaServerSettings = z.infer<typeof llamaServerSettingsSchema>;
