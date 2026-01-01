"use client";

import { Button, Box, CircularProgress } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface DialogActionButtonsProps {
  onReset: () => void;
  onClose: () => void;
  onSave: () => void;
  hasChanges: boolean;
  isValid: boolean;
  isSaving: boolean;
}

export const DialogActionButtons = ({
  onReset,
  onClose,
  onSave,
  hasChanges,
  isValid,
  isSaving,
}: DialogActionButtonsProps) => {
  const theme = useTheme();

  return (
    <>
      <Button
        onClick={onReset}
        color="warning"
        sx={{
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
          },
        }}
      >
        Réinitialiser aux Valeurs par Défaut
      </Button>
      <Box sx={{ flex: 1 }} />
      <Button
        onClick={onClose}
        sx={{
          transition: "all 0.2s ease",
        }}
      >
        Annuler
      </Button>
      <Button
        onClick={onSave}
        variant="contained"
        color="primary"
        disabled={!hasChanges || !isValid || isSaving}
        startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <EditIcon />}
        sx={{
          transition: "all 0.2s ease",
          minWidth: 140,
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: theme.shadows[4],
          },
          "&:active": {
            transform: "translateY(0)",
          },
        }}
      >
        {isSaving ? "Sauvegarde..." : "Sauvegarder la Configuration"}
      </Button>
    </>
  );
};
