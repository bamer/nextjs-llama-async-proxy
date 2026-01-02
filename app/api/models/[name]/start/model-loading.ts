import { getLogger } from "@/lib/logger";

const logger = getLogger();

/**
 * Check if model can be loaded (concurrent limits, server status)
 * @param llamaService - Llama service instance
 * @param name - Model name
 * @returns Object with canLoad flag and error response if not loadable
 */
interface ErrorResponse {
  error: string;
  model: string;
  status: string;
  runningModels?: string;
  maxConcurrent?: number;
  hint?: string;
}

export function checkModelLoadingConstraints(
  llamaService: {
    getState: () => {
      status: string;
      models?: Array<{ id?: string; name?: string; path?: string; available?: boolean; status?: string }>;
    };
  },
  name: string,
  maxConcurrent: number
): { canLoad: boolean; errorResponse?: ErrorResponse } {
  const state = llamaService.getState();
  logger.info(`[API] Current llama-server status: ${state.status}`);

  if (state.status !== "ready") {
    return {
      canLoad: false,
      errorResponse: {
        error: `Llama server is not ready (status: ${state.status})`,
        model: name,
        status: "error",
      },
    };
  }

  const models = state.models || [];
  const runningModels = models.filter((m) =>
    m.status === "running" || m.status === "loaded"
  );

  logger.info(`[API] Currently running models: ${runningModels.length} (max: ${maxConcurrent})`);

  if (runningModels.length >= maxConcurrent) {
    const runningModelNames = runningModels.map((m) => m.name).join(", ");
    logger.warn(`[API] Max concurrent models (${maxConcurrent}) reached. Currently running: ${runningModelNames}`);
    return {
      canLoad: false,
      errorResponse: {
        error: `Maximum concurrent models (${maxConcurrent}) reached. Currently running: ${runningModelNames}`,
        model: name,
        status: "error",
        runningModels: runningModelNames,
        maxConcurrent,
        hint: maxConcurrent === 1 ? "Stop the currently running model first, or increase Max Concurrent Models in Settings." : "Increase Max Concurrent Models in Settings to run more models simultaneously.",
      },
    };
  }

  return { canLoad: true };
}

/**
 * Find model data in llama service state
 * @param llamaService - Llama service instance
 * @param name - Model name
 * @returns Model data or null if not found
 */
export function findModelData(
  llamaService: {
    getState: () => {
      models?: Array<{ id?: string; name?: string; available?: boolean }>;
    };
  },
  name: string
): { id?: string; name?: string; available?: boolean } | null {
  const modelsList = llamaService.getState().models || [];
  const modelData = modelsList.find(
    (m: { id?: string; name?: string; available?: boolean }) =>
      m.id === name || m.name === name
  );

  if (!modelData) {
    logger.warn(`[API] Model ${name} was not found in discovered models`);
  }

  return modelData || null;
}
