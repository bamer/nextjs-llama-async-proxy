import type { Socket } from "socket.io";
import type { LlamaService } from "./llama/LlamaService";
import type { LlamaServiceState } from "./llama/types";
import type { SystemMetrics } from "@/types/monitoring";
import { setupMetricsHandlers } from "./modules/handlers-metrics";
import { setupModelsHandlers } from "./modules/handlers-models";
import { setupLogsHandlers } from "./modules/handlers-logs";
import { setupServerControlHandlers } from "./modules/handlers-server";
import { setupConfigHandlers } from "./modules/handlers-config";
import { setupModelCRUDHandlers } from "./modules/handlers-model-crud";

export function setupWebSocketHandlers(
  socket: Socket,
  {
    llamaService,
    modelImportService,
    collectMetrics,
    broadcastState,
  }: {
    llamaService: LlamaService | null;
    modelImportService: any;
    collectMetrics: () => Promise<SystemMetrics>;
    broadcastState: (state: unknown) => void;
  }
): void {
  const dependencies = {
    llamaService,
    modelImportService,
    collectMetrics,
    broadcastState,
  };

  setupMetricsHandlers(socket, dependencies);
  setupModelsHandlers(socket, dependencies);
  setupLogsHandlers(socket);
  setupServerControlHandlers(socket, dependencies);
  setupConfigHandlers(socket);
  setupModelCRUDHandlers(socket);
}
