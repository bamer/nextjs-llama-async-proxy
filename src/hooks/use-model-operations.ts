import { useModelStartStop } from "./use-model-start-stop";
import { useModelCRUD } from "./use-model-crud";

interface UseModelOperationsOptions {
  setLoading: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseModelOperationsReturn {
  handleStartModel: (modelId: string) => Promise<void>;
  handleStopModel: (modelId: string) => Promise<void>;
  handleRefresh: () => void;
  handleSaveModel: (config: Partial<import("@/types").ModelConfig>) => Promise<void>;
  handleDeleteModel: (modelId: string) => Promise<void>;
}

/**
 * Main hook for model operations using composition pattern
 * Combines start/stop and CRUD operations from specialized hooks
 *
 * This hook delegates to specialized hooks:
 * - useModelStartStop: for starting and stopping models
 * - useModelCRUD: for refreshing, saving, and deleting models
 *
 * Refactored from 213 lines to ~30 lines using composition
 */
export function useModelOperations(
  options: UseModelOperationsOptions,
): UseModelOperationsReturn {
  // Use composition to combine specialized hooks
  const { handleStartModel, handleStopModel } = useModelStartStop(options);
  const { handleRefresh, handleSaveModel, handleDeleteModel } = useModelCRUD();

  return {
    handleStartModel,
    handleStopModel,
    handleRefresh,
    handleSaveModel,
    handleDeleteModel,
  };
}