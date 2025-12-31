"use client";

import { Menu, MenuItem } from "@mui/material";
import { Delete } from "@mui/icons-material";

interface ModelActionsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function ModelActionsMenu({
  anchorEl,
  open,
  onClose,
  onDelete,
}: ModelActionsMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      <MenuItem onClick={onDelete} sx={{ color: "error.main" }}>
        <Delete sx={{ mr: 1 }} />
        Delete Model
      </MenuItem>
    </Menu>
  );
}
