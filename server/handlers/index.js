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
import { registerPresetsHandlers } from "./presets.js";
import { registerProcessHandlers } from "./llama-router/process-handlers.js";
import { logger } from "./logger.js";
import { LlamaServerProcessManager } from "./llama-router/process-manager.js";

// Create process manager instance
let processManager = null;

function getProcessManager(db) {
  if (!processManager) {
    const config = db.getConfig();
    processManager = new LlamaServerProcessManager({
      baseModelsPath: config.baseModelsPath,
      port: config.llama_server_port || 8080,
      host: config.llama_server_host || "0.0.0.0",
      modelsMax: config.maxModelsLoaded || 4,
      ctxSize: config.ctx_size || 4096,
      batchSize: config.batch_size || 512,
      threads: config.threads || 4,
      ngl: config.gpuLayers || 0,
    });
  }
  return processManager;
}

/**
 * Register all Socket.IO event handlers
 */
export function registerHandlers(io, db, ggufParser) {
  logger.setIo(io);
  logger.setDb(db);

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
    registerPresetsHandlers(socket, db);
    registerProcessHandlers(socket, io, db, getProcessManager(db));
  });
}
