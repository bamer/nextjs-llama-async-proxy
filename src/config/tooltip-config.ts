import { ConfigType } from "@/components/ui/ModelConfigDialog";
import type { TooltipContent, TooltipConfig } from "./tooltip-config.types";
import {
  modelTooltips,
  samplingTooltips,
  ropeScalingTooltips,
  loraTooltips,
  multimodalTooltips,
} from "./model-tooltips";
import { memoryTooltips } from "./metrics-tooltips";
import { uiTooltips, gpuTooltips, advancedTooltips } from "./ui-tooltips";

export { type TooltipContent, type TooltipConfig };

export const tooltipConfig: TooltipConfig = {
  sampling: samplingTooltips,
  memory: memoryTooltips,
  gpu: gpuTooltips,
  advanced: advancedTooltips,
  lora: loraTooltips,
  multimodal: multimodalTooltips,
};

export function getTooltipContent(
  configType: ConfigType,
  fieldName: string
): TooltipContent | undefined {
  return tooltipConfig[configType]?.[fieldName];
}

// Individual category exports for convenience
export { modelTooltips, memoryTooltips, uiTooltips };
