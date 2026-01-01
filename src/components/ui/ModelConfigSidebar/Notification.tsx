"use client";

import { Box, IconButton, Typography } from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface NotificationProps {
  open: boolean;
  message: string;
  severity: "success" | "error";
  onDismiss: () => void;
}

export const Notification = ({
  open,
  message,
  severity,
  onDismiss,
}: NotificationProps) => {
  const theme = useTheme();

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        right: 516,
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 2,
          borderRadius: 1,
          backgroundColor:
            severity === "success"
              ? theme.palette.success.main
              : theme.palette.error.main,
          color: "white",
          boxShadow: theme.shadows[6],
        }}
      >
        {severity === "success" ? <CheckCircleIcon /> : <ErrorIcon />}
        <Typography variant="body2">{message}</Typography>
        <IconButton
          size="small"
          onClick={onDismiss}
          sx={{ color: "inherit" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
