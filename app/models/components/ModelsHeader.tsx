"use client";

import { Typography, Box, Button, IconButton, CircularProgress } from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";

interface ModelsHeaderProps {
  isDark: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onAddModel: () => void;
}

export function ModelsHeader({
  isDark,
  refreshing,
  onRefresh,
  onAddModel,
}: ModelsHeaderProps) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <div>
        <Typography variant="h3" component="h1" fontWeight="bold">
          AI Models Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure and monitor your AI models
        </Typography>
      </div>
      <Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          sx={{ mt: 3 }}
          onClick={onAddModel}
        >
          Add Model
        </Button>
        <IconButton
          onClick={onRefresh}
          color="primary"
          disabled={refreshing}
          sx={{
            background: isDark
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(13, 158, 248, 0.1)",
            "&:hover": {
              background: isDark
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(13, 158, 248, 0.2)",
            },
          }}
        >
          {refreshing ? <CircularProgress size={20} /> : <Refresh />}
        </IconButton>
      </Box>
    </Box>
  );
}
