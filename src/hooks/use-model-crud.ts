import { useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useStore } from "@/lib/store";
import { storeToDatabaseModel } from "../../app/models/utils/model-utils";
import {
  parseModelIdToDbId,
  isValidDbId,
  createNewModel,
  convertModelTypeToDbType,
  getNumericParameter,
  getStringParameter,
} from "./model-operation-utils";
import { showSuccess, showError } from "@/utils/toast-helpers";

interface UseModelCRUDReturn {
  handleRefresh: () => void;
  handleSaveModel: (config: Partial<import("@/types").ModelConfig>) => Promise<void>;
  handleDeleteModel: (modelId: string) => Promise<void>;
}

/**
 * Hook for model CRUD operations
 * Provides functions to refresh, save, and delete models
 */
export function useModelCRUD(): UseModelCRUDReturn {
  const { sendMessage } = useWebSocket();
  const updateStoreModel = useStore((state) => state.updateModel);

  /**
   * Refresh the models list by rescanning
   */
  const handleRefresh = useCallback(() => {
    sendMessage("rescanModels", {});
  }, [sendMessage]);

  /**
    * Save or update a model configuration
    * @param config - Partial model configuration to save
    */
  const handleSaveModel = useCallback(
    async (config: Partial<import("@/types").ModelConfig>) => {
      const allModels = useStore.getState().models;
      const existing = allModels.find((m) => m.name === config.name);

      if (existing) {
        // Update existing model
        const updatedModel = { ...existing, ...config };
        updateStoreModel(existing.id, config);
        showSuccess("Model Updated", `${existing.name} configuration has been saved`);

        if (isValidDbId(existing.id)) {
          const dbId = parseModelIdToDbId(existing.id);
          sendMessage("update_model", {
            id: dbId,
            updates: storeToDatabaseModel(updatedModel),
          });
          console.log("[useModelCRUD] Updating model in database:", existing.name);
        }
      } else if (config.name) {
        // Create new model
        const newModel = createNewModel(config);
        const dbType = convertModelTypeToDbType(newModel.type);

        sendMessage("save_model", {
          name: newModel.name,
          type: dbType,
          status: "stopped",
          ctx_size: getNumericParameter(newModel.parameters, "ctx_size", 0),
          batch_size: getNumericParameter(newModel.parameters, "batch_size", 2048),
          threads: getNumericParameter(newModel.parameters, "threads", -1),
          model_path: getStringParameter(newModel.parameters, "model_path"),
          model_url: getStringParameter(newModel.parameters, "model_url"),
        });
        console.log("[useModelCRUD] Creating new model:", newModel.name);

        useStore.getState().addModel(newModel);
        showSuccess("Model Added", `${newModel.name} has been added to the library`);
      }
    },
    [updateStoreModel, sendMessage],
  );

  /**
    * Delete a model by its ID
    * @param modelId - Model identifier
    */
  const handleDeleteModel = useCallback(
    async (modelId: string) => {
      const model = useStore.getState().models.find((m) => m.id === modelId);
      if (!model) {
        console.error("[useModelCRUD] Model not found:", modelId);
        showError("Model Not Found", "The specified model could not be found");
        return;
      }

      const modelName = model.name;
      useStore.getState().removeModel(modelId);
      showSuccess("Model Deleted", `${modelName} has been removed from the library`);

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("delete_model", { id: dbId });
        console.log("[useModelCRUD] Deleting model from database:", modelId);
      }
    },
    [sendMessage],
  );

  return {
    handleRefresh,
    handleSaveModel,
    handleDeleteModel,
  };
}
