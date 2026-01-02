import { TooltipContent } from "./tooltip-config.types";
import { gpuTooltips } from "./tooltips/gpu-tooltips";
import { advancedTooltips } from "./tooltips/advanced-tooltips";

/**
 * Combined UI tooltips configuration
 * Includes GPU and advanced configuration tooltips
 */
export const uiTooltips: Record<string, TooltipContent> = {
  ...gpuTooltips,
  ...advancedTooltips,
};
