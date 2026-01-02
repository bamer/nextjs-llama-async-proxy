import { TooltipContent } from "./tooltip-config.types";
import { samplingTooltips } from "./model-tooltips-base";
import { dryTooltips, ropeScalingTooltips } from "./model-tooltips-advanced";
import { loraTooltips, multimodalTooltips } from "./model-tooltips-custom";

export { samplingTooltips, dryTooltips, ropeScalingTooltips, loraTooltips, multimodalTooltips };

export const modelTooltips: Record<string, TooltipContent> = {
  ...samplingTooltips,
  ...dryTooltips,
  ...ropeScalingTooltips,
  ...loraTooltips,
  ...multimodalTooltips,
};
