// server/handlers/index.js

import { logger } from "./logger.js";
import { fileLogger } from "./file-logger.js";
import { registerConnectionHandlers } from "./connection.js";
import { registerModelsHandlers } from "./models/index.js";
import { registerMetricsHandlers } from "./metrics.js";
import { registerLogsHandlers } from "./logs.js";
import { registerConfigHandlers } from "./config.js";
import { registerLlamaHandlers } from "./llama.js";
import { ok, err } from "./response.js";
import { fileTypeMap } from "./constants.js";

// Assuming these are exported from llama-router/index.js based on the test's expectations
import {
  startLlamaServerRouter,
  stopLlamaServerRouter,
  getLlamaStatus,
  loadModel,
  unloadModel,
  getRouterState,
} from "./llama-router/index.js";

/**
 * Register all Socket.IO event handlers for the application.
 * Sets up logger, file logger, and per-connection handlers.
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} db - Database instance.
 * @param {Object} ggufParser - GGUF parser instance.
 */
const registerHandlers = (io, db, ggufParser) => {
  if (!io) {
    throw new TypeError("Socket.IO server instance (io) is required.");
  }

  // Set io and db for loggers
  logger.setIo(io);
  logger.setDb(db);
  fileLogger.setIo(io);
  fileLogger.setDb(db);

  io.on("connection", (socket) => {
    logger.info(`[Connection] Client connected: ${socket.id}`);

    registerConnectionHandlers(socket, logger);
    registerModelsHandlers(socket, io, db, ggufParser);
    registerMetricsHandlers(socket, db);
    registerLogsHandlers(socket, db);
    registerConfigHandlers(socket, db);
    registerLlamaHandlers(socket, io, db);
  });
};

export {
  registerHandlers,
  logger,
  ok,
  err,
  fileTypeMap,
  startLlamaServerRouter,
  stopLlamaServerRouter,
  getLlamaStatus,
  loadModel,
  unloadModel,
  getRouterState,
};
