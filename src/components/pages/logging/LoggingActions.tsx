"use client";

import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface LoggingActionsProps {
  onSave: () => void;
  onReset: () => void;
  loading: boolean;
  hasChanges?: boolean;
}

export default function LoggingActions({
  onSave,
  onReset,
  loading,
  hasChanges = false,
}: LoggingActionsProps): React.ReactElement {
  const { isDark } = useTheme();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <Card
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          boxShadow: isDark
            ? "0 8px 30px rgba(0, 0, 0, 0.3)"
            : "0 8px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Logging Configuration Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Save or reset your logging configuration
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={onReset}
                disabled={loading}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onSave}
                disabled={loading || !hasChanges}
              >
                Save Configuration
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </m.div>
  );
}
