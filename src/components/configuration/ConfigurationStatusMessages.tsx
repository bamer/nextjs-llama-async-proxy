'use client';

import { Card, CardContent, Box, Typography } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { CheckCircle, ErrorOutline } from "@mui/icons-material";

interface ConfigurationStatusMessagesProps {
  saveSuccess: boolean;
  validationErrors: string[];
}

export function ConfigurationStatusMessages({
  saveSuccess,
  validationErrors,
}: ConfigurationStatusMessagesProps): React.ReactNode {
  const { isDark } = useTheme();

  return (
    <>
      {/* Success Message */}
      {saveSuccess && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            sx={{
              mb: 3,
              background: isDark
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(16, 185, 129, 0.05)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="body1" color="success">
                  Configuration saved successfully!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </m.div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            sx={{
              mb: 3,
              background: isDark
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(239, 68, 68, 0.05)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <ErrorOutline color="error" />
                <Typography
                  variant="body1"
                  color="error"
                  fontWeight="medium"
                >
                  Configuration Errors
                </Typography>
              </Box>
              <Box sx={{ ml: 4 }}>
                {validationErrors.map((error, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    color="error"
                    sx={{ mb: 1 }}
                  >
                    • {error}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </m.div>
      )}
    </>
  );
}
