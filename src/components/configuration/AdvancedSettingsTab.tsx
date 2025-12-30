"use client";

import React from "react";
import { Typography, Box, Button } from "@mui/material";
import { Tune as AdvancedIcon, Restore, Sync } from "@mui/icons-material";
import { m } from "framer-motion";
import { FormSection } from "@/components/ui/FormSection";
import { useTheme } from "@/contexts/ThemeContext";

interface AdvancedSettingsTabProps {
  isSaving: boolean;
  onReset: () => void;
  onSync: () => void;
}

export function AdvancedSettingsTab({
  isSaving,
  onReset,
  onSync,
}: AdvancedSettingsTabProps): React.ReactNode {
  const { isDark } = useTheme();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <FormSection title="Advanced Settings" icon={<AdvancedIcon />} divider={false}>
        <Box>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Advanced configuration options for power users.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Restore />}
              onClick={onReset}
              disabled={isSaving}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="outlined"
              startIcon={<Sync />}
              onClick={onSync}
              disabled={isSaving}
            >
              Sync with Backend
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Current configuration version: 2.0
          </Typography>
        </Box>
      </FormSection>
    </m.div>
  );
}
