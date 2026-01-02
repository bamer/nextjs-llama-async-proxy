import {
  MenuItem,
  Checkbox,
  ListItemText,
  Box,
} from "@mui/material";

interface SelectAllItemProps {
  checked: boolean;
  indeterminate: boolean;
  onClick: () => void;
}

/**
 * Select All menu item component
 */
export function SelectAllItem({ checked, indeterminate, onClick }: SelectAllItemProps) {
  return (
    <MenuItem
      onClick={onClick}
      sx={{
        fontWeight: 600,
        color: "primary.main",
        "&:hover": {
          backgroundColor: "primary.light",
        },
      }}
    >
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        size="small"
      />
      <ListItemText primary={checked ? "Deselect All" : "Select All"} />
    </MenuItem>
  );
}

interface MultiSelectCheckboxItemProps<T> {
  value: T;
  label: string;
  color?: string | undefined;
  checked: boolean;
  onClick: (value: T) => void;
}

/**
 * Individual checkbox item for MultiSelect
 */
export function MultiSelectCheckboxItem<T>({
  value,
  label,
  color,
  checked,
  onClick,
}: MultiSelectCheckboxItemProps<T>) {
  return (
    <MenuItem
      value={String(value)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick(value);
      }}
      sx={{
        py: 0.5,
        "&:hover": {
          backgroundColor: color ? `${color}20` : "action.hover",
        },
      }}
    >
      <Checkbox
        checked={checked}
        size="small"
        sx={{
          color,
          "&.Mui-checked": { color },
        }}
      />
      <ListItemText
        primary={label}
        sx={{
          color: checked ? color : "text.primary",
          fontWeight: checked ? 600 : 400,
        }}
      />
    </MenuItem>
  );
}

interface SelectedValueDisplayProps {
  selected: Set<unknown>;
  placeholder: string;
  options: Array<{ value: unknown; label: string; color?: string }>;
  maxSelectedDisplay: number;
  displayAllWhenFull: boolean;
}

/**
 * Display selected values as chips or text
 */
export function SelectedValueDisplay({
  selected,
  placeholder,
  options,
  maxSelectedDisplay,
  displayAllWhenFull,
}: SelectedValueDisplayProps) {
  if (selected.size === 0) {
    return (
      <Box
        sx={{
          color: "text.secondary",
        }}
        component="span"
      >
        {placeholder}
      </Box>
    );
  }

  if (displayAllWhenFull || selected.size <= maxSelectedDisplay) {
    return (
      <>
        {options
          .filter((opt) => selected.has(opt.value))
          .map((opt) => (
            <Box
              key={String(opt.value)}
              component="span"
              sx={{
                display: "inline-flex",
                backgroundColor: opt.color,
                color: "white",
                fontWeight: 600,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                mr: 0.5,
                mb: 0.5,
              }}
            >
              {opt.label}
            </Box>
          ))}
      </>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        backgroundColor: "primary.main",
        color: "white",
        fontWeight: 600,
        px: 1,
        py: 0.25,
        borderRadius: 1,
      }}
    >
      {selected.size} selected
    </Box>
  );
}
