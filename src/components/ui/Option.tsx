'use client';

import { MenuItem, Checkbox, ListItemText, SxProps } from '@mui/material';

export interface OptionProps<T = string> {
  value: T;
  label: string;
  selected?: boolean;
  color?: string;
  onClick?: (value: T) => void;
  sx?: SxProps;
}

export function Option<T = string>({ value, label, selected = false, color, onClick, sx }: OptionProps<T>) {
  return (
    <MenuItem
      value={String(value)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick?.(value); }}
      sx={{ py: 0.5, '&:hover': { backgroundColor: color ? `${color}20` : 'action.hover' }, ...sx }}
    >
      <Checkbox checked={selected} size="small" sx={{ color, '&.Mui-checked': { color } }} />
      <ListItemText primary={label} sx={{ color: selected ? color : 'text.primary', fontWeight: selected ? 600 : 400 }} />
    </MenuItem>
  );
}

export default Option;
