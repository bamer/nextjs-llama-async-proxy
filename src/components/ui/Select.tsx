'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Select,
  Box,
  Typography,
  SxProps,
  SelectProps,
} from '@mui/material';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  color?: string;
}

interface BaseSelectProps<T = string> extends Omit<SelectProps, 'value' | 'onChange'> {
  value: Set<T>;
  onChange: (selected: Set<T>) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  displayValue?: (selected: Set<T>, options: SelectOption<T>[]) => React.ReactNode;
  children?: React.ReactNode;
}

export function BaseSelect<T = string>({
  value: externalSelected,
  onChange,
  options,
  placeholder = 'Select...',
  displayValue,
  children,
  ...selectProps
}: BaseSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string[]>([]);
  const externalSelectedRef = useRef(externalSelected);

  // Sync internal state with external prop
  useEffect(() => {
    externalSelectedRef.current = externalSelected;
    const selectedArray = Array.from(externalSelected).map(String);
    setInternalValue(selectedArray);
  }, [externalSelected]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (_event: unknown, newValue: unknown) => {
    // Fallback: just sync internal state with MUI's value
    // Actual selection updates are handled by option onClick handlers
    const values = Array.isArray(newValue) ? newValue as unknown[] : [];
    setInternalValue(values as string[]);
  };

  return (
    <Select
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      value={internalValue}
      onChange={handleChange}
      renderValue={() => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {displayValue ? displayValue(externalSelectedRef.current, options) : (
            externalSelectedRef.current.size === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary' }}
              >
                {placeholder}
              </Typography>
            ) : (
              <Typography variant="body2">
                {`${externalSelectedRef.current.size} selected`}
              </Typography>
            )
          )}
        </Box>
      )}
      sx={{
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          py: selectProps.size === 'small' ? 1 : 1.5,
        },
      }}
      {...selectProps}
    >
      {children}
    </Select>
  );
}

export default BaseSelect;
