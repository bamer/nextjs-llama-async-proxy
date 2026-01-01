import type { Socket } from "socket.io";
import type { WebSocketHandlersDependencies } from "../server.types";
import { getLogger } from "../../../lib/logger";
import { saveModel, updateModel, deleteModel } from "../../../lib/database";

const logger = getLogger();

export function setupModelCRUDHandlers(socket: Socket): void {
  socket.on("save_model", async (data: any) => {
    try {
      const model = await saveModel(data);
      socket.emit("model_saved", {
        success: true,
        data: model,
        timestamp: Date.now(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      socket.emit("model_saved", {
        success: false,
        error: { code: "SAVE_MODEL_FAILED", message },
        timestamp: Date.now(),
      });
    }
  });

  socket.on("update_model", async (data: { id: number; updates: any }) => {
    try {
      const model = await updateModel(data.id, data.updates);
      socket.emit("model_updated", {
        success: true,
        data: model,
        timestamp: Date.now(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      socket.emit("model_updated", {
        success: false,
        error: { code: "UPDATE_MODEL_FAILED", message },
        timestamp: Date.now(),
      });
    }
  });

  socket.on("delete_model", async (data: { id: number }) => {
    try {
      await deleteModel(data.id);
      socket.emit("model_deleted", {
        success: true,
        data: { id: data.id },
        timestamp: Date.now(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      socket.emit("model_deleted", {
        success: false,
        error: { code: "DELETE_MODEL_FAILED", message },
        timestamp: Date.now(),
      });
    }
  });
}
