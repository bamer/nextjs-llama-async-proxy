"use client";

import { Box, Typography } from "@mui/material";

interface ErrorMessageProps {
  message: string;
  isDark: boolean;
}

export function ErrorMessage({ message, isDark }: ErrorMessageProps) {
  return (
    <Box
      sx={{
        p: 2,
        mb: 3,
        bgcolor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
        border: "1px solid #ef4444",
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" color="error">
        {message}
      </Typography>
    </Box>
  );
}
