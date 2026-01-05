"use client";

import { forwardRef, useState, ChangeEvent, Ref } from "react";
import { TextField, InputAdornment, IconButton, TextFieldProps } from "@mui/material";
import { Close } from "@mui/icons-material";

export type FormFieldType = "text" | "number" | "email" | "password" | "search" | "select";

export interface FormFieldProps extends Omit<TextFieldProps, "onChange" | "type" | "placeholder"> {
  label?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  fieldType?: FormFieldType;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

const INPUT_HEIGHT = 44;

export const FormField = forwardRef(function FormField(
  {
    label,
    placeholder,
    value,
    onChange,
    fieldType = "text",
    error,
    helperText,
    disabled,
    required,
    startAdornment,
    endAdornment,
    size = "medium",
    fullWidth = true,
    ...props
  }: FormFieldProps,
  ref: Ref<HTMLInputElement>
) {
  const [searchValue, setSearchValue] = useState(value ?? "");
  const isSearch = fieldType === "search";
  const inputType = fieldType === "search" ? "text" : fieldType;
  const validType = (["text", "number", "password"].includes(inputType) ? inputType : "text") as "text" | "number" | "password";
  const inputValue = value !== undefined ? value : searchValue;
  const showClear = isSearch && inputValue && !disabled;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = fieldType === "number" ? Number(e.target.value) : e.target.value;
    if (isSearch) setSearchValue(newValue as string);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setSearchValue("");
    onChange?.("");
  };

  return (
    <TextField
      label={label}
      placeholder={placeholder || ""}
      value={inputValue}
      onChange={handleChange}
      type={validType}
      error={Boolean(error)}
      helperText={helperText}
      disabled={Boolean(disabled)}
      required={Boolean(required)}
      size={size}
      fullWidth={fullWidth}
      sx={{
        height: INPUT_HEIGHT,
        "& .MuiOutlinedInput-root": {
          borderRadius: 1,
          height: INPUT_HEIGHT,
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
        },
        "& .MuiInputBase-input": { height: INPUT_HEIGHT - 16, py: 1.25 },
        ...props.sx,
      }}
      InputProps={{
        startAdornment: startAdornment && <InputAdornment position="start">{startAdornment}</InputAdornment>,
        endAdornment: endAdornment || (showClear && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClear} edge="end"><Close fontSize="small" /></IconButton>
          </InputAdornment>
        )),
      }}
      InputLabelProps={{ shrink: true }}
      inputRef={ref}
    />
  );
});