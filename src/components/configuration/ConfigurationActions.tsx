'use client';

import { Box, Button } from "@mui/material";
import { Save } from "@mui/icons-material";

interface ConfigurationActionsProps {
  isSaving: boolean;
  onSave: () => void;
}

export function ConfigurationActions({
  isSaving,
  onSave,
}: ConfigurationActionsProps) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Save />}
        onClick={onSave}
        disabled={isSaving}
        size="large"
      >
        {isSaving ? "Saving..." : "Save Configuration"}
      </Button>
    </Box>
  );
}
