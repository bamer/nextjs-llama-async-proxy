"use client";

import type { FieldDefinition } from "./ModelConfigDialog/types";
import type { TooltipContent as TooltipContentType } from "@/config/tooltip-config";
import { BasicConfigField } from "../config/BasicConfigField";
import { AdvancedConfigField } from "../config/AdvancedConfigField";

interface ConfigFieldsProps {
  field: FieldDefinition;
  value: unknown;
  error: string | boolean | undefined;
  tooltipContent: TooltipContentType | undefined | null;
  useSlider: boolean;
  onFieldChange: (name: string, value: unknown) => void;
  onToggleSlider: (fieldName: string) => void;
  validationRules?: {
    min?: number;
    max?: number;
  };
  formatValue: (value: unknown, unit?: string) => string;
}

export const ConfigFields = ({
  field,
  value,
  error,
  tooltipContent,
  useSlider,
  onFieldChange,
  onToggleSlider,
  validationRules,
  formatValue,
}: ConfigFieldsProps) => {
  // Use AdvancedConfigField for number type (supports slider)
  if (field.type === "number") {
    return (
      <AdvancedConfigField
        field={field}
        value={value}
        error={error}
        tooltipContent={tooltipContent}
        useSlider={useSlider}
        onFieldChange={onFieldChange}
        onToggleSlider={onToggleSlider}
        validationRules={validationRules ?? {}}
        formatValue={formatValue}
      />
    );
  }

  // Use BasicConfigField for text, select, and boolean types
  return (
    <BasicConfigField
      field={field}
      value={value}
      error={error}
      tooltipContent={tooltipContent}
      onFieldChange={onFieldChange}
    />
  );
};
