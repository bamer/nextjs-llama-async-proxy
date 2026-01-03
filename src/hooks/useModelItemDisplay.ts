"use client";

import type { ModelConfig } from "../components/dashboard/hooks/useModelItemHandlers";
import { getStatusColor } from "../components/dashboard/model-item-utils";
import { getStatusLabel } from "./use-model-item";

export interface ModelItemDisplayResult {
  displayStatus: string;
  displayStatusColor: 'default' | 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';
  showProgress: boolean;
  statusValue: string;
}

export function useModelItemDisplay({
  model,
  optimisticStatus,
}: {
  model: ModelConfig;
  optimisticStatus?: string;
}): ModelItemDisplayResult {
  const statusValue = optimisticStatus || model.status;
  const displayStatus = getStatusLabel(statusValue, model.progress);
  const displayStatusColor = getStatusColor(statusValue);
  const showProgress = statusValue === 'loading' && model.progress !== undefined;

  return {
    displayStatus,
    displayStatusColor,
    showProgress,
    statusValue,
  };
}
