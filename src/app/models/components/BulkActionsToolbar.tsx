"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import { Button as CustomButton } from "@/components/ui/Button";

interface BulkActionsToolbarProps {
  selectedCount: number;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
  onStartSelected: () => void;
  onStopSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export const BulkActionsToolbar = ({
  selectedCount,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  onStartSelected,
  onStopSelected,
  onDeleteSelected,
  onClearSelection,
}: BulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 1.5,
        borderRadius: 3,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <input
          type="checkbox"
          checked={isAllSelected}
          ref={(input) => {
            if (input) input.indeterminate = isIndeterminate;
          }}
          onChange={onSelectAll}
          aria-label="Select all models"
        />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {selectedCount} selected
        </Typography>
      </Box>

      <Divider orientation="vertical" flexItem />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button variant="contained" color="success" onClick={onStartSelected} size="small">
          Start Selected
        </Button>
        <Button variant="outlined" onClick={onStopSelected} size="small">
          Stop Selected
        </Button>
        <Button variant="outlined" color="error" onClick={onDeleteSelected} size="small">
          Delete Selected
        </Button>
      </Box>

      <Divider orientation="vertical" flexItem />

      <IconButton onClick={onClearSelection} aria-label="Clear selection" size="small">
        <Typography sx={{ fontSize: 18 }}>✕</Typography>
      </IconButton>
    </Paper>
  );
};
