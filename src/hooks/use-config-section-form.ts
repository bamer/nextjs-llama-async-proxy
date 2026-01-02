"use client";

import { useMemo } from "react";
import type { ConfigType, FieldDefinition } from "@/components/ui/ModelConfigDialog/types";
import { configFields, validationRules } from "@/components/ui/ModelConfigDialog/config-data";
import { formatValue } from "@/components/ui/ModelConfigDialog/utils";
import { getTooltipContent, type TooltipContent as TooltipContentType } from "@/config/tooltip-config";

interface UseConfigSectionFormParams {
  sectionFields: string[];
  configType: ConfigType;
  editedConfig: Record<string, unknown>;
  errors: Record<string, string | boolean | undefined>;
  sliderMode: Record<string, boolean>;
}

interface FieldRenderData {
  field: FieldDefinition;
  value: unknown;
  error: string | boolean | undefined;
  tooltipContent: TooltipContentType | null;
  useSlider: boolean;
}

export const useConfigSectionForm = ({
  sectionFields,
  configType,
  editedConfig,
  errors,
  sliderMode,
}: UseConfigSectionFormParams) => {
  // Get field definitions for this section
  const fields = useMemo(() => {
    return sectionFields
      .map((fieldName) => configFields[configType].find((f) => f.name === fieldName))
      .filter(Boolean) as FieldDefinition[];
  }, [sectionFields, configType]);

  // Get render data for each field
  const getFieldRenderData = (field: FieldDefinition): FieldRenderData => {
    const value = editedConfig[field.name] ?? field.defaultValue;
    const error = errors[field.name];
    const tooltipContent = getTooltipContent(configType, field.name) as TooltipContentType | null;
    const useSlider = field.type === "number" && sliderMode[field.name];

    return { field, value, error, tooltipContent, useSlider };
  };

  // Get validation rules for a field
  const getFieldValidation = (fieldName: string) => {
    return validationRules[fieldName];
  };

  // Format value for display
  const formatFieldValue = (value: unknown, field: FieldDefinition) => {
    return formatValue(value, field.unit);
  };

  return {
    fields,
    getFieldRenderData,
    getFieldValidation,
    formatFieldValue,
  };
};
