import { Box } from "@mui/material";
import type { FieldDefinition } from "@/components/ui/ModelConfigDialog/types";
import type { TooltipContent } from "@/config/tooltip-config";
import { TextFieldWithTooltipWrapper } from "./TextFieldWithTooltipWrapper";
import { NumberFieldSlider } from "./NumberFieldSlider";
import { NumberFieldInput } from "./NumberFieldInput";
import { SelectField } from "./SelectField";
import { BooleanField } from "./BooleanField";
import { FieldWithTooltip } from "@/components/ui/FormTooltip";

interface ConfigFieldProps {
  field: FieldDefinition;
  value: unknown;
  error?: string;
  tooltipContent?: TooltipContent;
  useSlider: boolean;
  onFieldChange: (name: string, value: unknown) => void;
  onToggleSlider: (fieldName: string) => void;
  validationRules?: Record<string, { min?: number; max?: number }>;
}

export function ConfigField({
  field,
  value,
  error,
  tooltipContent,
  useSlider,
  onFieldChange,
  onToggleSlider,
  validationRules = {},
}: ConfigFieldProps) {
  switch (field.type) {
    case "text":
      return (
        <TextFieldWithTooltipWrapper
          field={field}
          value={value}
          error={error}
          tooltipContent={tooltipContent}
          onFieldChange={onFieldChange}
        />
      );

    case "number":
      const numberField = (
        <Box>
          {useSlider && field.step !== undefined ? (
            <NumberFieldSlider
              field={field}
              value={value}
              error={error}
              onFieldChange={onFieldChange}
              onToggleSlider={onToggleSlider}
              validationRules={validationRules}
            />
          ) : (
            <NumberFieldInput
              field={field}
              value={value}
              error={error}
              onFieldChange={onFieldChange}
              onToggleSlider={onToggleSlider}
            />
          )}
        </Box>
      );

      if (tooltipContent) {
        return <FieldWithTooltip content={tooltipContent}>{numberField}</FieldWithTooltip>;
      }
      return numberField;

    case "select":
      return (
        <SelectField
          field={field}
          value={value}
          error={error}
          tooltipContent={tooltipContent}
          onFieldChange={onFieldChange}
        />
      );

    case "boolean":
      return (
        <BooleanField
          field={field}
          value={value}
          tooltipContent={tooltipContent}
          onFieldChange={onFieldChange}
        />
      );

    default:
      return null;
  }
}
