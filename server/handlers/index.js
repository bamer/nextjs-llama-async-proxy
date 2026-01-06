/**
 * Socket.IO Event Handlers
 * Modular handler system for llama.cpp router mode
 */

// Response helpers
export { ok, err } from "./response.js";

// Constants
export { fileTypeMap } from "./constants.js";

// Logger
export { logger } from "./logger.js";

// Router management
export {
  startLlamaServerRouter,
  stopLlamaServerRouter,
  getLlamaStatus,
  loadModel,
  unloadModel,
  getRouterState,
} from "./llama-router/index.js";

// Handler modules
import { registerConnectionHandlers } from "./connection.js";
import { registerModelsHandlers } from "./models/index.js";
import { registerMetricsHandlers } from "./metrics.js";
import { registerLogsHandlers } from "./logs.js";
import { registerConfigHandlers } from "./config.js";
import { registerLlamaHandlers } from "./llama.js";
import { logger } from "./logger.js";

/**
 * Register all Socket.IO event handlers
 */
export function registerHandlers(io, db, ggufParser) {
  logger.setIo(io);

  io.on("connection", (socket) => {
    const cid = socket.id;
    logger.info(`Client connected: ${cid}`);

    // Register all handler groups
    registerConnectionHandlers(socket, logger);
    registerModelsHandlers(socket, io, db, ggufParser);
    registerMetricsHandlers(socket, db);
    registerLogsHandlers(socket, db);
    registerConfigHandlers(socket, db);
    registerLlamaHandlers(socket, io, db);
  });
}
