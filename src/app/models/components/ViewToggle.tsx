"use client";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import GridIcon from "@mui/icons-material/GridOn";
import ListIcon from "@mui/icons-material/ViewList";
import TableIcon from "@mui/icons-material/TableChart";

interface ViewToggleProps {
  value: "grid" | "list" | "table";
  onChange: (value: "grid" | "list" | "table") => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_, newValue) => newValue && onChange(newValue)}
      size="small"
    >
      <ToggleButton value="grid" aria-label="grid view">
        <GridIcon />
      </ToggleButton>
      <ToggleButton value="list" aria-label="list view">
        <ListIcon />
      </ToggleButton>
      <ToggleButton value="table" aria-label="table view">
        <TableIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
