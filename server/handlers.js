/**
 * Socket.IO Event Handlers
 * Modular handler system for llama.cpp router mode
 */

// Response helpers
export { ok, err } from "./handlers/response.js";

// Constants
export { fileTypeMap } from "./handlers/constants.js";

// Logger
export { logger } from "./handlers/logger.js";

// Router management
export {
  startLlamaServerRouter,
  stopLlamaServerRouter,
  getLlamaStatus,
  loadModel,
  unloadModel,
  getRouterState,
} from "./handlers/llama-router/index.js";

// Handler modules
import { registerConnectionHandlers } from "./handlers/connection.js";
import { registerModelsHandlers } from "./handlers/models/index.js";
import { registerMetricsHandlers } from "./handlers/metrics.js";
import { registerLogsHandlers } from "./handlers/logs.js";
import { registerConfigHandlers } from "./handlers/config.js";
import { registerLlamaHandlers } from "./handlers/llama.js";
import { registerPresetsHandlers } from "./handlers/presets/handlers.js";
import { logger } from "./handlers/logger.js";

/**
 * Register all Socket.IO event handlers
 */
export function registerHandlers(io, db, ggufParser, initializeLlamaMetrics) {
  logger.setIo(io);
  logger.setDb(db);

  // Register global handlers directly on 'io'
  console.log("[HANDLERS] Registering global Llama handlers..."); // ADDED LOG
  registerLlamaHandlers(io, db, initializeLlamaMetrics);
  console.log("[HANDLERS] Global Llama handlers registered."); // ADDED LOG

  io.on("connection", (socket) => { // This is the connection handler for individual sockets
    const cid = socket.id;
    logger.info(`Client connected: ${cid}`);

    // Register per-socket handlers
    registerConnectionHandlers(socket, logger);
    registerModelsHandlers(socket, io, db, ggufParser);
    registerMetricsHandlers(socket, db);
    registerLogsHandlers(socket, db);
    registerConfigHandlers(socket, db);
    registerPresetsHandlers(socket, db);
  });
}
