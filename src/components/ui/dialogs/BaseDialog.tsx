"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps,
  Button,
  CircularProgress,
} from "@mui/material";

export interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: DialogProps["maxWidth"];
  showDefaultActions?: boolean;
  onSave?: () => void | Promise<void>;
  saveDisabled?: boolean;
  isSaving?: boolean;
  saveText?: string;
  cancelText?: string;
}

const BaseDialog: React.FC<BaseDialogProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = "sm",
  showDefaultActions = false,
  onSave,
  saveDisabled = false,
  isSaving = false,
  saveText = "Save",
  cancelText = "Cancel",
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {showDefaultActions && (
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
            {cancelText}
          </Button>
          <Button
            onClick={onSave}
            variant="contained"
            disabled={saveDisabled || isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : undefined}
          >
            {saveText}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default BaseDialog;
