// src/lib/validators/api/legacy.validator.ts

import { z } from "zod";

/**
 * Legacy Config Schema
 * @deprecated Use specific config schemas instead
 */
export const configSchema = z
  .object({
    models: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1),
        options: z.object({
          temperature: z.number().min(0).max(1),
          top_p: z.number().min(0).max(1),
        }),
      })
    ),
    parameters: z.array(
      z.object({
        category: z.string().min(1),
        paramName: z.string().min(1),
      })
    ),
  })
  .strict()
  .describe("Legacy config schema");

/**
 * Legacy Parameter Schema
 * @deprecated Use modelConfigSchema instead
 */
export const parameterSchema = z
  .object({
    category: z.string().min(1),
    paramName: z.string().min(1),
  })
  .strict()
  .describe("Legacy parameter schema");

/**
 * Legacy WebSocket Schema
 * @deprecated Use websocketMessageSchema instead
 */
export const websocketSchema = z
  .object({
    message: z.string().min(1),
    clientId: z.string().uuid(),
    timestamp: z.number().int(),
  })
  .strict()
  .describe("Legacy websocket schema");

// Types
export type Config = z.infer<typeof configSchema>;
export type Parameter = z.infer<typeof parameterSchema>;
export type LegacyWebSocket = z.infer<typeof websocketSchema>;
