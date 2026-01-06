/**
 * Models Handlers
 * Socket.IO handlers for model operations - barrel file
 */

import { registerModelsCrudHandlers } from "./crud.js";
import { registerModelsRouterHandlers } from "./router-ops.js";
import { registerModelsScanHandlers } from "./scan.js";

/**
 * Register all models handlers
 */
export function registerModelsHandlers(socket, io, db, ggufParser) {
  registerModelsCrudHandlers(socket, io, db);
  registerModelsRouterHandlers(socket, io);
  registerModelsScanHandlers(socket, io, db, ggufParser);
}
