'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  Typography,
  SxProps,
} from '@mui/material';

export interface MultiSelectOption<T = string> {
  value: T;
  label: string;
  color?: string;
}

interface MultiSelectProps<T = string> {
  label?: string;
  options: MultiSelectOption<T>[];
  selected: Set<T>;
  onChange: (selected: Set<T>) => void;
  sx?: SxProps;
  placeholder?: string;
  disabled?: boolean;
  showSelectAll?: boolean;
  maxSelectedDisplay?: number;
  displayAllWhenFull?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export function MultiSelect<T = string>({
  options,
  selected: externalSelected,
  onChange,
  sx,
  placeholder = 'Select...',
  disabled = false,
  showSelectAll = true,
  maxSelectedDisplay = 3,
  displayAllWhenFull = false,
  size = 'small',
  fullWidth = true,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState<T[]>([]);

  const externalSelectedRef = useRef(externalSelected);

  // Sync internal state with external prop
  useEffect(() => {
    externalSelectedRef.current = externalSelected;
    const selectedArray = Array.from(externalSelected);
    setInternalSelected(selectedArray);
  }, [externalSelected]);

  const handleToggleAll = useCallback(() => {
    const newSelected = externalSelectedRef.current.size === options.length
      ? new Set<T>()
      : new Set(options.map((opt) => opt.value));
    onChange(newSelected);
    setOpen(false);
  }, [options, onChange]);

  const isSelectedAll = externalSelectedRef.current.size === options.length;
  const isSelectedSome = externalSelectedRef.current.size > 0 && externalSelectedRef.current.size < options.length;

  const getDisplayValue = () => {
    if (externalSelectedRef.current.size === 0) {
      return placeholder;
    }

    if (displayAllWhenFull || externalSelectedRef.current.size <= maxSelectedDisplay) {
      return options
        .filter((opt) => externalSelectedRef.current.has(opt.value))
        .map((opt) => opt.label)
        .join(', ');
    }

    return `${externalSelectedRef.current.size} selected`;
  };

  return (
    <Box sx={{ minWidth: 200, ...sx }}>
      <Select
        id="log-levels-select"
        name="log-levels-select"
        multiple
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        value={internalSelected.map(String)}
        onChange={(_event, newValue) => {
          // Fallback: just sync internal state with MUI's value
          // Actual selection updates are handled by MenuItem onClick handlers
          const values = Array.isArray(newValue) ? newValue as unknown[] : [];
          setInternalSelected(values as T[]);
        }}
        disabled={disabled}
        size={size}
        fullWidth={fullWidth}
        renderValue={() => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {externalSelectedRef.current.size === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary' }}
              >
                {placeholder}
              </Typography>
            ) : displayAllWhenFull || externalSelectedRef.current.size <= maxSelectedDisplay ? (
              options
                .filter((opt) => externalSelectedRef.current.has(opt.value))
                .map((opt) => (
                  <Chip
                    key={String(opt.value)}
                    label={opt.label}
                    size="small"
                    sx={{
                      backgroundColor: opt.color,
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                ))
            ) : (
              <Chip
                label={`${externalSelectedRef.current.size} selected`}
                size="small"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        )}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            py: size === 'small' ? 1 : 1.5,
          },
        }}
      >
        {showSelectAll && options.length > 1 && (
          <MenuItem
            onClick={handleToggleAll}
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.light',
              },
            }}
          >
            <Checkbox
              checked={isSelectedAll}
              indeterminate={isSelectedSome}
              size="small"
            />
            <ListItemText primary={isSelectedAll ? 'Deselect All' : 'Select All'} />
          </MenuItem>
        )}

        {options.map((option) => (
          <MenuItem
            key={String(option.value)}
            value={String(option.value)}
            onClick={(event) => {
              // Prevent default MUI selection behavior
              event.preventDefault();
              event.stopPropagation();

              // Manually toggle the option
              const currentSelected = new Set(externalSelectedRef.current);
              if (currentSelected.has(option.value)) {
                currentSelected.delete(option.value);
              } else {
                currentSelected.add(option.value);
              }
              onChange(currentSelected);
            }}
            sx={{
              py: 0.5,
              '&:hover': {
                backgroundColor: option.color ? `${option.color}20` : 'action.hover',
              },
            }}
          >
            <Checkbox
              checked={externalSelectedRef.current.has(option.value)}
              size="small"
              sx={{
                color: option.color,
                '&.Mui-checked': { color: option.color },
              }}
            />
            <ListItemText
              primary={option.label}
              sx={{
                color: externalSelectedRef.current.has(option.value) ? option.color : 'text.primary',
                fontWeight: externalSelectedRef.current.has(option.value) ? 600 : 400,
              }}
            />
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default MultiSelect;
