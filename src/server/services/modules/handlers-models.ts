import type { Socket } from "socket.io";
import type { LlamaModel } from "../llama/LlamaService";
import type { WebSocketHandlersDependencies } from "../server.types";
import { transformLlamaModelToDisplay, startModelViaChatCompletion } from "../server.utils";

export function setupModelsHandlers(
  socket: Socket,
  { llamaService, modelImportService }: WebSocketHandlersDependencies
): void {
  socket.on("requestModels", handleRequestModels);
  socket.on("request_models", handleRequestModels);

  socket.on("rescanModels", handleRescanModels);
  socket.on("load_models", handleLoadModelsFromDb);

  socket.on("startModel", handleStartModel);
  socket.on("stopModel", handleStopModel);

  socket.on("toggle_model", handleToggleModel);
  socket.on("toggleModel", handleToggleModel);

  function handleRequestModels() {
    if (!llamaService) return;

    const state = llamaService.getState();
    socket.emit("models", {
      type: "models",
      data: state.models.map(transformLlamaModelToDisplay),
      timestamp: Date.now(),
    });
  }

  async function handleRescanModels() {
    try {
      const result = await modelImportService.importModels();
      socket.emit("llamaStatus", {
        type: "status",
        data: {
          message: `Models imported: ${result.imported} new, ${result.updated} updated, ${result.errors} errors`,
        },
        timestamp: Date.now(),
      });
      socket.emit("models_imported", {
        type: "models_imported",
        data: {
          imported: result.imported,
          updated: result.updated,
          errors: result.errors,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      socket.emit("llamaStatus", {
        type: "error",
        data: { error: "Failed to import models" },
        timestamp: Date.now(),
      });
    }
  }

  async function handleLoadModelsFromDb() {
    const { getModels } = require("../../lib/database");
    try {
      const models = getModels();
      socket.emit("models_loaded", {
        type: "models_loaded",
        data: models.map((m: any) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          status: m.status,
          size: m.file_size_bytes,
          createdAt: new Date(m.created_at).toISOString(),
          updatedAt: new Date(m.updated_at).toISOString(),
        })),
        timestamp: Date.now(),
      });
    } catch (error) {
      socket.emit("llamaStatus", {
        type: "error",
        data: { error: "Failed to load models" },
        timestamp: Date.now(),
      });
    }
  }

  async function handleStartModel(data: { modelId: string }) {
    if (!llamaService) {
      socket.emit("error", { message: "Llama service not available" });
      return;
    }

    const state = llamaService.getState();
    const model = state.models.find((m: LlamaModel) => m.id === data.modelId || m.name === data.modelId);

    if (!model) {
      socket.emit("error", { message: `Model ${data.modelId} not found` });
      return;
    }

    const success = await startModelViaChatCompletion(model.name);

    if (success) {
      socket.emit("modelStarted", { modelId: data.modelId, status: "running" });
    } else {
      socket.emit("error", { message: "Failed to start model" });
    }
  }

  async function handleStopModel(data: { modelId: string }) {
    socket.emit("modelStopped", {
      modelId: data.modelId,
      message: "llama.cpp auto-manages model memory. Model will be unloaded when loading a different one.",
    });
  }

  async function handleToggleModel(data: { modelId: string }) {
    if (!llamaService) {
      socket.emit("error", { message: "Llama service not available" });
      return;
    }

    const state = llamaService.getState();
    const model = state.models.find((m: LlamaModel) => m.id === data.modelId || m.name === data.modelId);

    if (!model) {
      socket.emit("error", { message: `Model ${data.modelId} not found` });
      return;
    }

    const success = await startModelViaChatCompletion(model.name);

    if (success) {
      socket.emit("modelToggled", { modelId: data.modelId, status: "running" });
    } else {
      socket.emit("error", { message: "Failed to start model" });
    }
  }
}
