// src/lib/validators/api/rescan.validator.ts

import { z } from "zod";

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

// Types
export type RescanRequest = z.infer<typeof rescanRequestSchema>;
