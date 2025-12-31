'use client';

import { useState, useRef, useEffect, useEffectEvent as ReactUseEffectEvent } from 'react';
import { Select, MenuItem, Checkbox, ListItemText, SelectProps } from '@mui/material';

export interface SelectMenuOption<T = string> {
  value: T;
  label: string;
  color?: string;
}

interface SelectMenuProps<T = string> extends Omit<SelectProps, 'value' | 'onChange'> {
  value: Set<T>;
  onChange: (selected: Set<T>) => void;
  options: SelectMenuOption<T>[];
  showSelectAll?: boolean;
}

export function SelectMenu<T = string>({
  value: externalSelected,
  onChange,
  options,
  showSelectAll = true,
  ...selectProps
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string[]>([]);
  const externalSelectedRef = useRef(externalSelected);

  useEffect(() => {
    externalSelectedRef.current = externalSelected;
    setInternalValue(Array.from(externalSelected).map(String));
  }, [externalSelected]);

  const handleToggleAll = ReactUseEffectEvent(() => {
    const newSelected = externalSelectedRef.current.size === options.length
      ? new Set<T>()
      : new Set(options.map((opt) => opt.value));
    onChange(newSelected);
    setOpen(false);
  });

  const handleOptionClick = (optionValue: T) => {
    const currentSelected = new Set(externalSelectedRef.current);
    if (currentSelected.has(optionValue)) {
      currentSelected.delete(optionValue);
    } else {
      currentSelected.add(optionValue);
    }
    onChange(currentSelected);
  };

  const isSelectedAll = externalSelectedRef.current.size === options.length;
  const isSelectedSome = externalSelectedRef.current.size > 0 && externalSelectedRef.current.size < options.length;

  return (
    <Select
      multiple
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      value={internalValue}
      onChange={(_, newValue) => setInternalValue(Array.isArray(newValue) ? newValue as string[] : [])}
      sx={{
        '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: selectProps.size === 'small' ? 1 : 1.5 },
      }}
      {...selectProps}
    >
      {showSelectAll && options.length > 1 && (
        <MenuItem
          onClick={handleToggleAll}
          sx={{ fontWeight: 600, color: 'primary.main', '&:hover': { backgroundColor: 'primary.light' } }}
        >
          <Checkbox checked={isSelectedAll} indeterminate={isSelectedSome} size="small" />
          <ListItemText primary={isSelectedAll ? 'Deselect All' : 'Select All'} />
        </MenuItem>
      )}
      {options.map((option) => (
        <MenuItem
          key={String(option.value)}
          value={String(option.value)}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOptionClick(option.value); }}
          sx={{ py: 0.5, '&:hover': { backgroundColor: option.color ? `${option.color}20` : 'action.hover' } }}
        >
          <Checkbox checked={externalSelectedRef.current.has(option.value)} size="small" sx={{ color: option.color, '&.Mui-checked': { color: option.color } }} />
          <ListItemText
            primary={option.label}
            sx={{ color: externalSelectedRef.current.has(option.value) ? option.color : 'text.primary', fontWeight: externalSelectedRef.current.has(option.value) ? 600 : 400 }}
          />
        </MenuItem>
      ))}
    </Select>
  );
}

export default SelectMenu;
