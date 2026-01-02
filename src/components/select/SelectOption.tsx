"use client";

import { Checkbox, ListItemText, MenuItem } from "@mui/material";
import type { SxProps } from "@mui/material/styles";
import type { MultiSelectOption } from "@/components/ui/MultiSelect";

interface SelectOptionProps<T = string> {
  option: MultiSelectOption<T>;
  selected: Set<T>;
  onChange: (selected: Set<T>) => void;
  sx?: SxProps;
}

export function SelectOption<T = string>({
  option,
  selected,
  onChange,
  sx,
}: SelectOptionProps<T>) {
  const handleOptionClick = (event: React.MouseEvent<HTMLLIElement>) => {
    // Prevent default MUI selection behavior
    event.preventDefault();
    event.stopPropagation();

    // Manually toggle the option
    const currentSelected = new Set(selected);
    if (currentSelected.has(option.value)) {
      currentSelected.delete(option.value);
    } else {
      currentSelected.add(option.value);
    }
    onChange(currentSelected);
  };

  return (
    <MenuItem
      key={String(option.value)}
      value={String(option.value)}
      onClick={handleOptionClick}
      sx={{
        py: 0.5,
        "&:hover": {
          backgroundColor: option.color ? `${option.color}20` : "action.hover",
        },
        ...sx,
      }}
    >
      <Checkbox
        checked={selected.has(option.value)}
        size="small"
        sx={{
          color: option.color,
          "&.Mui-checked": { color: option.color },
        }}
      />
      <ListItemText
        primary={option.label}
        sx={{
          color: selected.has(option.value) ? option.color : "text.primary",
          fontWeight: selected.has(option.value) ? 600 : 400,
        }}
      />
    </MenuItem>
  );
}
