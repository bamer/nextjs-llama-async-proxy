"use client";

import type { ConfigType, FieldDefinition, SectionGroup, ValidationRule } from "./types";
import {
  modelSectionGroups,
  modelValidationRules,
  modelConfigFields,
} from "./model-config-data";
import {
  memorySectionGroups,
  gpuSectionGroups,
  inferenceValidationRules,
  memoryConfigFields,
  gpuConfigFields,
} from "./inference-config-data";
import {
  advancedSectionGroups,
  advancedConfigFields,
  advancedValidationRules,
} from "./system-config-data";
import {
  loraSectionGroups,
  loraConfigFields,
  loraValidationRules,
} from "./lora-config-data";
import {
  multimodalSectionGroups,
  multimodalConfigFields,
  multimodalValidationRules,
} from "./multimodal-config-data";

// Section groups for accordion organization
export const sectionGroups: Record<ConfigType, SectionGroup[]> = {
  sampling: modelSectionGroups,
  memory: memorySectionGroups,
  gpu: gpuSectionGroups,
  advanced: advancedSectionGroups,
  lora: loraSectionGroups,
  multimodal: multimodalSectionGroups,
};

// Validation rules for different fields
export const validationRules: Record<string, ValidationRule> = {
  ...modelValidationRules,
  ...inferenceValidationRules,
  ...advancedValidationRules,
  ...loraValidationRules,
  ...multimodalValidationRules,
};

// Field definitions for each config type
export const configFields: Record<ConfigType, FieldDefinition[]> = {
  sampling: modelConfigFields,
  memory: memoryConfigFields,
  gpu: gpuConfigFields,
  advanced: advancedConfigFields,
  lora: loraConfigFields,
  multimodal: multimodalConfigFields,
};
