'use client';

import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { Save, Restore, Sync } from "@mui/icons-material";

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
      <Card
        sx={{
          mb: 4,
          background: isDark
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          boxShadow: isDark
            ? "0 8px 30px rgba(0, 0, 0, 0.3)"
            : "0 8px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={4}>
            Advanced Settings
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={3}>
            Advanced configuration options for power users.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
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

          <Typography variant="body2" color="text.secondary" mb={2}>
            Current configuration version: 2.0
          </Typography>
        </CardContent>
      </Card>
    </m.div>
  );
}
