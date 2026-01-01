"use client";

import type { ConfigType, ValidationRule } from "./types";
import { configFields } from "./config-data";

// Fields that are stored as numbers in database but should be boolean in UI
const numberToBooleanFields = [
  "mmap",
  "mlock",
  "list_devices",
  "repack",
  "no_host",
  "swa_full",
  "cpu_moe",
  "kv_unified",
  "context_shift",
  "offline",
  "op_offload",
  "check_tensors",
  "mmproj_auto",
  "mmproj_offload",
  "ignore_eos",
];

// Helper function to convert database config to UI format
export const convertConfigFromDatabase = (config: Record<string, unknown>): Record<string, unknown> => {
  const converted: Record<string, unknown> = { ...config };

  numberToBooleanFields.forEach((field) => {
    if (typeof converted[field] === "number") {
      converted[field] = (converted[field] as number) !== 0;
    }
  });

  return converted;
};

// Helper function to convert config for database compatibility
export const convertConfigForDatabase = (config: Record<string, unknown>): Record<string, unknown> => {
  const converted: Record<string, unknown> = { ...config };

  numberToBooleanFields.forEach((field) => {
    if (typeof converted[field] === "boolean") {
      converted[field] = (converted[field] as boolean) ? 1 : 0;
    }
  });

  return converted;
};

// Validate single field
export const validateField = (
  fieldName: string,
  value: unknown,
  validationRules: Record<string, ValidationRule>
): string | null => {
  const rule = validationRules[fieldName];
  if (!rule) return null;

  // Required check
  if (rule.required && (value === "" || value === null || value === undefined)) {
    return "Ce champ est requis";
  }

  // Type-specific validation
  if (typeof value === "number") {
    if (rule.min !== undefined && value < rule.min) {
      return `La valeur doit être au moins ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return `La valeur doit être au plus ${rule.max}`;
    }
  }

  if (rule.pattern && typeof value === "string") {
    if (!rule.pattern.test(value)) {
      return "Format invalide";
    }
  }

  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) return customError;
  }

  return null;
};

// Validate all fields
export const validateAll = (
  configToValidate: Record<string, unknown>,
  validateFieldFn: (fieldName: string, value: unknown) => string | null
): { errors: Record<string, string>; isValid: boolean } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.keys(configToValidate).forEach((fieldName) => {
    const error = validateFieldFn(fieldName, configToValidate[fieldName]);
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  });

  return { errors, isValid };
};

// Format value for display
export const formatValue = (value: unknown, unit?: string): string => {
  if (typeof value === "number") {
    if (unit) {
      return `${value} ${unit}`;
    }
    // Format float numbers to 2 decimal places
    if (!Number.isInteger(value)) {
      return value.toFixed(2);
    }
    return value.toString();
  }
  return String(value);
};

// Get default config values for a config type
export const getDefaultConfig = (configType: ConfigType): Record<string, unknown> => {
  const fields = configFields[configType];
  const defaults: Record<string, unknown> = {};
  fields.forEach((field) => {
    defaults[field.name] = field.defaultValue;
  });
  return defaults;
};

// Get default slider mode state
export const getDefaultSliderMode = (configType: ConfigType): Record<string, boolean> => {
  const fields = configFields[configType];
  const sliderModeDefaults: Record<string, boolean> = {};
  fields.forEach((field) => {
    // Enable slider by default for numeric fields with step defined
    if (field.type === "number" && field.step !== undefined) {
      sliderModeDefaults[field.name] = true;
    }
  });
  return sliderModeDefaults;
};
