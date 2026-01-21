/**
 * Models Handlers
 * Socket.IO handlers for model operations - barrel file
 */

import { registerModelsCrudHandlers } from "./crud.js";
import { registerModelsRouterHandlers } from "./router-ops.js";
import { registerModelsScanHandlers } from "./scan.js";

/**
 * Register all models handlers for Socket.IO connection.
 * @param {object} socket - Socket.IO socket instance.
 * @param {object} io - Socket.IO server instance.
 * @param {object} db - Database instance.
 * @param {function} ggufParser - GGUF metadata parser function.
 */
export function registerModelsHandlers(socket, io, db, ggufParser) {
  registerModelsCrudHandlers(socket, io, db);
  registerModelsRouterHandlers(socket, io);
  registerModelsScanHandlers(socket, io, db, ggufParser);
}
