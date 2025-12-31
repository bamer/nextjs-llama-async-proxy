"use client";

import { Box, Typography, Button } from "@mui/material";
import { Add } from "@mui/icons-material";

interface EmptyStateProps {
  isDark: boolean;
  onAddModel: () => void;
}

export function EmptyState({ isDark, onAddModel }: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        border: `2px dashed ${isDark ? "rgba(255,255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"}`,
        borderRadius: "8px",
        mt: 4,
      }}
    >
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No models found
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Add your first AI model to get started
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={onAddModel}
      >
        Add Model
      </Button>
    </Box>
  );
}
