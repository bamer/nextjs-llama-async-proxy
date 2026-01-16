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
 * Register all Socket.IO event handlers for the application.
 * Sets up global handlers and per-socket handlers for client connections.
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} db - Database instance for data operations.
 * @param {Object} ggufParser - GGUF file parser instance.
 * @param {Function} initializeLlamaMetrics - Function to initialize metrics collection.
 */
export function registerHandlers(io, db, ggufParser, initializeLlamaMetrics) {
  logger.setIo(io);
  logger.setDb(db);

  io.on("connection", (socket) => { 
    const cid = socket.id;
    logger.info(`Client connected: ${cid}`);

    // Register per-socket handlers
    registerConnectionHandlers(socket, logger);
    registerModelsHandlers(socket, io, db, ggufParser);
    registerMetricsHandlers(socket, db);
    registerLogsHandlers(socket, db);
    registerConfigHandlers(socket, db);
    registerPresetsHandlers(socket, db);
    
    // Moved inside connection block and added io parameter
    registerLlamaHandlers(socket, io, db, initializeLlamaMetrics);
  });
}
