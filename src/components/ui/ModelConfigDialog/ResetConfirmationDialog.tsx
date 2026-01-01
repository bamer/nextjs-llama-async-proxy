"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { Restore as RestoreIcon } from "@mui/icons-material";
import type { ConfigType } from "./types";

interface ResetConfirmationDialogProps {
  open: boolean;
  configType: ConfigType | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const ResetConfirmationDialog = ({
  open,
  configType,
  onConfirm,
  onClose,
}: ResetConfirmationDialogProps) => {
  const configTitle = configType ? configType.charAt(0).toUpperCase() + configType.slice(1) : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RestoreIcon color="warning" />
          <Typography variant="h6">Réinitialiser aux Valeurs par Défaut</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography>
          Êtes-vous sûr de vouloir réinitialiser toute la configuration {configTitle} aux valeurs par défaut ? Cette action ne peut pas être annulée.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onConfirm} variant="contained" color="warning" startIcon={<RestoreIcon />}>
          Réinitialiser aux Valeurs par Défaut
        </Button>
      </DialogActions>
    </Dialog>
  );
};
