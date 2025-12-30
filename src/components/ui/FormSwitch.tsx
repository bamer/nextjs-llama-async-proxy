"use client";

import { FormControlLabel, Switch, type SwitchProps } from "@mui/material";
import FormTooltip from "@/components/ui/FormTooltip";

export interface FormSwitchProps extends Omit<SwitchProps, "onChange"> {
  label?: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  disabled?: boolean;
  helperText?: string;
  tooltip?: string;
}

export default function FormSwitch({
  label,
  checked,
  onChange,
  disabled = false,
  helperText,
  tooltip,
  ...switchProps
}: FormSwitchProps): JSX.Element {
  const labelContent = label ? (
    <span>
      {label}
      {helperText && (
        <span
          style={{
            display: "block",
            fontSize: "0.75rem",
            color: disabled ? "rgba(0, 0, 0, 0.38)" : "rgba(0, 0, 0, 0.6)",
            marginTop: "2px",
          }}
        >
          {helperText}
        </span>
      )}
    </span>
  ) : undefined;

  const control = (
    <FormControlLabel
      control={
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          {...switchProps}
        />
      }
      label={labelContent}
      disabled={disabled}
    />
  );

  if (tooltip) {
    return <FormTooltip title={tooltip}>{control}</FormTooltip>;
  }

  return control;
}
