// Minimal domain handler registrar (skeleton)
import { registerModelsHandlers } from "./models/index.js";
import { registerMetricsHandlers } from "./metrics.js";
import { registerLogsHandlers } from "./logs.js";
import { registerConfigHandlers } from "./config.js";
import { registerPresetsHandlers } from "./presets/handlers.js";

export function mountDomainHandlers(socket, io, db) {
  // Register per-domain handlers. Extend with more domains as they are implemented.
  if (typeof registerModelsHandlers === "function") {
    registerModelsHandlers(socket, io, db);
  }
  if (typeof registerMetricsHandlers === "function") {
    registerMetricsHandlers(socket, io, db);
  }
  if (typeof registerLogsHandlers === "function") {
    registerLogsHandlers(socket, io, db);
  }
  if (typeof registerConfigHandlers === "function") {
    registerConfigHandlers(socket, io, db);
  }
  // Future: registerPresetsHandlers, registerLlamaHandlers, etc.
}
