"use client";

import { Box, Button, CircularProgress } from "@mui/material";
import { Restore as RestoreIcon, Save as SaveIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface SidebarFooterProps {
  hasChanges: boolean;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export const SidebarFooter = ({
  hasChanges,
  isSaving,
  onReset,
  onSave,
}: SidebarFooterProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
        <Button
          onClick={onReset}
          startIcon={<RestoreIcon />}
          color="warning"
          sx={{
            minWidth: 120,
            "&:hover": {
              backgroundColor: theme.palette.warning.light,
              color: theme.palette.warning.dark,
            },
          }}
        >
          Reset
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="primary"
          startIcon={
            isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
          }
          disabled={!hasChanges || isSaving}
          sx={{
            minWidth: 140,
            fontWeight: 600,
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[4],
            },
            "&:active": {
              transform: "translateY(0)",
            },
          }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
};
