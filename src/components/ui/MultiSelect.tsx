"use client";

import { Select, Box, SxProps } from "@mui/material";
import {
  SelectAllItem,
  MultiSelectCheckboxItem,
  SelectedValueDisplay,
} from "./MultiSelect/components";
import { useMultiSelectState, useMultiSelectionHandlers } from "./MultiSelect/hooks";

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
  size?: "small" | "medium";
  fullWidth?: boolean;
}

export function MultiSelect<T = string>({
  options,
  selected,
  onChange,
  sx,
  placeholder = "Select...",
  disabled = false,
  showSelectAll = true,
  maxSelectedDisplay = 3,
  displayAllWhenFull = false,
  size = "small",
  fullWidth = true,
}: MultiSelectProps<T>) {
  const { open, setOpen, internalSelected, syncInternal } =
    useMultiSelectState(selected);

  const { handleToggleAll, handleToggleItem, getIsSelectedAll, getIsSelectedSome } =
    useMultiSelectionHandlers(options, selected, onChange, setOpen);

  const isSelectedAll = getIsSelectedAll();
  const isSelectedSome = getIsSelectedSome();

  return (
    <Box sx={{ minWidth: 200, ...sx }}>
      <Select
        id="multi-select"
        name="multi-select"
        multiple
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => {
          setOpen(true);
          syncInternal();
        }}
        value={internalSelected.map(String)}
        onChange={(_event, newValue) => {
          const values = Array.isArray(newValue) ? newValue as unknown[] : [];
        }}
        disabled={!!disabled}
        size={size}
        fullWidth={fullWidth}
        renderValue={() => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            <SelectedValueDisplay
              selected={selected}
              placeholder={placeholder}
              options={options}
              maxSelectedDisplay={maxSelectedDisplay}
              displayAllWhenFull={displayAllWhenFull}
            />
          </Box>
        )}
        sx={{
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            py: size === "small" ? 1 : 1.5,
          },
        }}
      >
        {showSelectAll && options.length > 1 && (
          <SelectAllItem
            checked={isSelectedAll}
            indeterminate={isSelectedSome}
            onClick={handleToggleAll}
          />
        )}

        {options.map((option) => {
          const color = option.color;
          return (
            <MultiSelectCheckboxItem
              key={String(option.value)}
              value={option.value}
              label={option.label}
              {...(color !== undefined ? { color } : {})}
              checked={selected.has(option.value)}
              onClick={handleToggleItem}
            />
          );
        })}
      </Select>
    </Box>
  );
}

export default MultiSelect;
