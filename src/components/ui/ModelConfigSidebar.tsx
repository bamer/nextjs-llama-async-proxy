"use client";

import { Drawer, Box } from "@mui/material";
import { memo } from "react";
import { useTheme } from "@mui/material/styles";
import type { ModelConfigSidebarProps } from "./ModelConfigSidebar/types";
import { SidebarHeader } from "./ModelConfigSidebar/Header";
import { ErrorMessage } from "./ModelConfigSidebar/ErrorMessage";
import { SidebarFooter } from "./ModelConfigSidebar/Footer";
import { Notification } from "./ModelConfigSidebar/Notification";
import { sectionGroups } from "./ModelConfigSidebar/section-groups";

export type { ModelConfigSidebarProps };
export { sectionGroups };

const ModelConfigSidebar = memo(({
  open,
  onClose,
  modelId,
  onSave,
  hasChanges,
  isSaving,
  error,
  notification,
  onDismissNotification,
  onReset,
  children,
}: ModelConfigSidebarProps) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 500,
          maxWidth: "90vw",
          backgroundColor: theme.palette.mode === "dark" ? "grey.900" : "#ffffff",
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <SidebarHeader modelId={modelId} hasChanges={hasChanges} onClose={onClose} />

      {/* Error Message */}
      <ErrorMessage error={error} />

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>

      {/* Footer */}
      <SidebarFooter
        hasChanges={hasChanges}
        isSaving={isSaving}
        onReset={onReset}
        onSave={() => onSave({})}
      />

      {/* Notification Snackbar */}
      {notification && (
        <Notification
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onDismiss={onDismissNotification}
        />
      )}
    </Drawer>
  );
});

ModelConfigSidebar.displayName = "ModelConfigSidebar";

export default ModelConfigSidebar;
