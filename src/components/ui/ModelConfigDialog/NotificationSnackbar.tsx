"use client";

import { Snackbar, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from "@mui/icons-material";

interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  severity: "success" | "error";
  onClose: () => void;
}

export const NotificationSnackbar = ({
  open,
  message,
  severity,
  onClose,
}: NotificationSnackbarProps) => {
  const theme = useTheme();

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        icon={severity === "success" ? <CheckCircleIcon /> : <ErrorIcon />}
        sx={{
          borderRadius: 1,
          boxShadow: theme.shadows[6],
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
