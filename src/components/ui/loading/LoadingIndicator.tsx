"use client";

import { Box, CircularProgress, Fade } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface LoadingIndicatorProps {
  show?: boolean;
  size?: number;
  thickness?: number;
  fullPage?: boolean;
  sx?: object;
}

export function LoadingIndicator({ show = true, size = 40, thickness = 4, fullPage = false, sx }: LoadingIndicatorProps) {
  const { isDark } = useTheme();
  const color = isDark ? "#60a5fa" : "#3b82f6";

  if (!show) return null;

  const indicator = (
    <Fade in={show}>
      <CircularProgress size={size} thickness={thickness} sx={{ color }} />
    </Fade>
  );

  if (fullPage) {
    return (
      <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(248, 250, 252, 0.9)", backdropFilter: "blur(4px)", zIndex: 9999, ...sx }}>
        {indicator}
      </Box>
    );
  }

  return <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", ...sx }}>{indicator}</Box>;
}

interface LoadingOverlayProps {
  show?: boolean;
  size?: number;
  children: React.ReactNode;
  sx?: object;
}

export function LoadingOverlay({ show, size = 40, children, sx }: LoadingOverlayProps) {
  const { isDark } = useTheme();
  const color = isDark ? "#60a5fa" : "#3b82f6";

  return (
    <Box sx={{ position: "relative", ...sx }}>
      {children}
      {show && (
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", backgroundColor: "rgba(0, 0, 0, 0.1)", zIndex: 1 }}>
          <CircularProgress size={size} sx={{ color }} />
        </Box>
      )}
    </Box>
  );
}
