// src/lib/validators/api/system-event.validator.ts

import { z } from "zod";

/**
 * System Event Schema
 */
export const systemEventSchema = z
  .object({
    eventType: z.string().min(1).describe("Event type"),
    severity: z.enum(["info", "warning", "error", "critical"]).describe("Severity level"),
    message: z.string().min(1).describe("Event message"),
    details: z.record(z.string(), z.unknown()).optional().describe("Event details"),
    timestamp: z.string().datetime().describe("ISO timestamp"),
  })
  .strict()
  .describe("System event");

// Types
export type SystemEvent = z.infer<typeof systemEventSchema>;
