import type { ModelConfig } from "../hooks/useModelItemHandlers";

export interface ModelItemMemoProps {
  model: ModelConfig;
  isDark: boolean;
  currentTemplate: string;
  loadingModels: Record<string, boolean>;
  optimisticStatus?: string;
}

/**
 * Custom comparison function for memo optimization.
 * Returns true if props are functionally equivalent (no re-render needed).
 */
export function modelItemMemoComparison(
  prevProps: ModelItemMemoProps,
  nextProps: ModelItemMemoProps
): boolean {
  const prevModel = prevProps.model;
  const nextModel = nextProps.model;

  return (
    prevProps.isDark === nextProps.isDark &&
    prevProps.currentTemplate === nextProps.currentTemplate &&
    prevProps.loadingModels[prevModel.id] === nextProps.loadingModels[nextModel.id] &&
    prevProps.optimisticStatus === nextProps.optimisticStatus &&
    prevModel.id === nextModel.id &&
    prevModel.name === nextModel.name &&
    prevModel.status === nextModel.status &&
    prevModel.progress === nextModel.progress &&
    prevModel.availableTemplates?.length === nextModel.availableTemplates?.length
  );
}
