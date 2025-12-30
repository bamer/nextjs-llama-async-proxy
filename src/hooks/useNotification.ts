"use client";

import { useCallback, useState } from "react";
import type { SnackbarCloseReason } from "@mui/material/Snackbar";

export type NotificationSeverity = "success" | "error" | "info" | "warning";

interface NotificationState {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
}

interface UseNotificationReturn {
  notification: NotificationState;
  showNotification: (message: string, severity?: NotificationSeverity, autoHideDelay?: number) => void;
  hideNotification: (_event?: Event | React.SyntheticEvent<any> | null, reason?: SnackbarCloseReason) => void;
}

export function useNotification(): UseNotificationReturn {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showNotification = useCallback((message: string, severity: NotificationSeverity = "info", autoHideDelay?: number) => {
    setNotification({ open: true, message, severity });

    if (autoHideDelay && autoHideDelay > 0) {
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, open: false }));
      }, autoHideDelay);
    }
  }, []);

  const hideNotification = useCallback((
    _event?: Event | React.SyntheticEvent<any> | null,
    reason?: SnackbarCloseReason
  ) => {
    // Don't close if reason is 'clickaway' (optional - remove if you want clickaway to close)
    if (reason === "clickaway") {
      return;
    }
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
}
