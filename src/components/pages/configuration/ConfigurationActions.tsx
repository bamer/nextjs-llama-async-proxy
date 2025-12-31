"use client";

import React from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import TuneIcon from "@mui/icons-material/Tune";
import RestoreIcon from "@mui/icons-material/Restore";
import { TabType } from "./ConfigurationTabs";
import { useTheme } from "@/contexts/ThemeContext";

interface ConfigurationActionsProps {
  activeTab: TabType;
  onSave: () => void;
  onApplyPreset?: (preset: string) => void;
  onReset?: () => void;
  hasChanges?: boolean;
  isSaving?: boolean;
}

export function ConfigurationActions({
  activeTab,
  onSave,
  onApplyPreset,
  onReset,
  hasChanges = false,
  isSaving = false,
}: ConfigurationActionsProps): React.ReactNode {
  const { isDark } = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 3, p: 2, borderRadius: 1, backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: 1, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
      <Tooltip title={hasChanges ? "Save all changes" : "No changes to save"}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} disabled={isSaving || !hasChanges} sx={{ minWidth: 120 }}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </Tooltip>

      <Tooltip title="Apply a configuration preset">
        <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => onApplyPreset?.("default")} disabled={isSaving} sx={{ minWidth: 140 }}>
          Apply Preset
        </Button>
      </Tooltip>

      {activeTab === "advanced" && onReset && (
        <Tooltip title="Reset to default values">
          <Button variant="outlined" startIcon={<RestoreIcon />} onClick={onReset} disabled={isSaving} sx={{ minWidth: 120 }}>
            Reset
          </Button>
        </Tooltip>
      )}

      <Box sx={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: hasChanges ? "warning.main" : "success.main", transition: "background-color 0.3s" }} />
        <Typography variant="caption" color="text.secondary">
          {hasChanges ? "Unsaved changes" : "All changes saved"}
        </Typography>
      </Box>
    </Box>
  );
}
