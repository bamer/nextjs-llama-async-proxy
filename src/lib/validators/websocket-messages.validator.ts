import { z } from "zod";
import {
  websocketMessageSchema as wsMessageSchema,
} from "./api.validator";
import { modelStatusUpdateSchema } from "./model-config.validator";

/**
 * Model Status Update Message Schema
 * Validates WebSocket messages for model status changes
 */
export const modelStatusUpdateMessageSchema = wsMessageSchema.extend({
  type: z.literal("model_status_update"),
  data: modelStatusUpdateSchema,
}).describe("WebSocket message containing model status update");

export type ModelStatusUpdateMessage = z.infer<typeof modelStatusUpdateMessageSchema>;
