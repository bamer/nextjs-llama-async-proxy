import { TooltipContent } from "./tooltip-config.types";
import { samplingBasicTooltips } from "./tooltips/sampling-basic-tooltips";
import { samplingAdvancedTooltips } from "./tooltips/sampling-advanced-tooltips";

/**
 * Sampling parameter tooltips
 * Combines basic and advanced sampling parameter tooltips
 */
export const samplingTooltips: Record<string, TooltipContent> = {
  ...samplingBasicTooltips,
  ...samplingAdvancedTooltips,
};
