import type { ConfigType } from "./types";
import { samplingSectionGroups } from "./sampling-sections";
import { memorySectionGroups, gpuSectionGroups } from "./system-sections";
import { advancedSectionGroups } from "./advanced-sections";
import { loraSectionGroups } from "./lora-sections";
import { multimodalSectionGroups } from "./multimodal-sections";

export const sectionGroups: Record<
  ConfigType,
  Array<{ title: string; icon: React.ReactNode; fields: string[] }>
> = {
  sampling: samplingSectionGroups,
  memory: memorySectionGroups,
  gpu: gpuSectionGroups,
  advanced: advancedSectionGroups,
  lora: loraSectionGroups,
  multimodal: multimodalSectionGroups,
};
