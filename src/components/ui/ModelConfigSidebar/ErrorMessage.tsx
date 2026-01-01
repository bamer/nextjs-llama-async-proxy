"use client";

import { Box, Typography } from "@mui/material";
import { Error as ErrorIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface ErrorMessageProps {
  error: string | null;
}

export const ErrorMessage = ({ error }: ErrorMessageProps) => {
  const theme = useTheme();

  if (!error) return null;

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: theme.palette.error.main + "15",
        borderBottom: `1px solid ${theme.palette.error.main}`,
      }}
    >
      <Typography
        variant="body2"
        color="error"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <ErrorIcon fontSize="small" />
        {error}
      </Typography>
    </Box>
  );
};
