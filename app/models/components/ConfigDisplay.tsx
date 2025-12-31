"use client";

import { Box, Typography } from "@mui/material";
import ConfigTypeSelector from "@/components/ui/ConfigTypeSelector";

interface ConfigDisplayProps {
  isDark: boolean;
  editingConfigType: string | null;
  editedConfig: Record<string, unknown>;
  setEditingConfigType: (type: string | null) => void;
}

export function ConfigDisplay({
  isDark,
  editingConfigType,
  editedConfig,
  setEditingConfigType,
}: ConfigDisplayProps) {
  return (
    <>
      <ConfigTypeSelector
        selectedType={editingConfigType as "sampling" | "memory" | "gpu" | "advanced" | "lora" | "multimodal" | null}
        onSelect={setEditingConfigType as (type: "sampling" | "memory" | "gpu" | "advanced" | "lora" | "multimodal" | null) => void}
        compact={true}
      />
      <Box sx={{ p: 2, mt: 2 }}>
        {editingConfigType ? (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {editingConfigType.charAt(0).toUpperCase() + editingConfigType.slice(1)} Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {Object.keys(editedConfig).length > 0
                ? `${Object.keys(editedConfig).length} parameter(s) configured`
                : "No configuration saved yet"}
            </Typography>
            {editedConfig && Object.keys(editedConfig).length > 0 && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: isDark
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(13, 158, 248, 0.1)",
                  borderRadius: 1,
                  maxHeight: 400,
                  overflowY: "auto",
                }}
              >
                {Object.entries(editedConfig).slice(0, 10).map(([key, value]: [string, unknown]) => (
                  <Box key={key} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      {key.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                        backgroundColor: isDark
                          ? "rgba(59, 130, 246, 0.1)"
                          : "rgba(13, 158, 248, 0.1)",
                        p: 1,
                        borderRadius: 0.5,
                      }}
                    >
                      {typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}
                    </Typography>
                  </Box>
                ))}
                {Object.keys(editedConfig).length > 10 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                    ... and {Object.keys(editedConfig).length - 10} more
                  </Typography>
                )}
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a configuration type above to view and edit parameters
          </Typography>
        )}
      </Box>
    </>
  );
}
