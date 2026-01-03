"use client";

import type { ModelConfig } from "../components/dashboard/hooks/useModelItemHandlers";
import { getStatusColor } from "../components/dashboard/model-item-utils";

export interface ModelItemDisplayResult {
  displayStatus: string;
  displayStatusColor: 'default' | 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';
  showProgress: boolean;
}

export function useModelItemDisplay({
  model,
  optimisticStatus,
}: {
  model: ModelConfig;
  optimisticStatus?: string;
}): ModelItemDisplayResult {
  const displayStatus = optimisticStatus || model.status;
  const displayStatusColor = getStatusColor(displayStatus);
  const showProgress = displayStatus === 'loading' && model.progress !== undefined;

  return {
    displayStatus,
    displayStatusColor,
    showProgress,
  };
}
