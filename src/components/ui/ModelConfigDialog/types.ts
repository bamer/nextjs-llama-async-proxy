"use client";

import { ReactNode } from "react";

export type ConfigType =
  | "sampling"
  | "memory"
  | "gpu"
  | "advanced"
  | "lora"
  | "multimodal";

export interface ModelConfigDialogProps {
  open: boolean;
  modelId: number | undefined;
  configType: ConfigType | null;
  config: Record<string, unknown>;
  onClose: () => void;
  onSave: (config: Record<string, unknown>) => void;
}

export interface ValidationRule {
  min?: number;
  max?: number;
  required?: boolean;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  defaultValue: unknown;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  validation?: ValidationRule;
  unit?: string;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
}

export interface SectionGroup {
  title: string;
  icon: ReactNode;
  fields: string[];
}

export interface FormState {
  editedConfig: Record<string, unknown>;
  hasChanges: boolean;
  sliderMode: Record<string, boolean>;
  errors: Record<string, string>;
  isSaving: boolean;
  showResetDialog: boolean;
  notification: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  expandedSections: Record<string, boolean>;
}
