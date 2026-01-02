"use client";

import type { ConfigType, SectionGroup } from "../components/ui/ModelConfigDialog/types";
import { basicSectionGroups } from "./sections/basic-sections";
import { advancedSectionGroups } from "./sections/advanced-sections";

// Merge basic and advanced section groups
export const sectionGroups: Record<ConfigType, SectionGroup[]> = {
  ...basicSectionGroups,
  ...advancedSectionGroups,
} as Record<ConfigType, SectionGroup[]>;