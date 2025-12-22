"use client";

import { CircularProgress, Box, Typography, LinearProgress } from "@mui/material";
import { m } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface ModernLoadingProps {
  fullScreen?: boolean;
  message?: string;
  type?: "spinner" | "linear" | "skeleton";
}

export function ModernLoading({ 
  fullScreen = false, 
  message = "Loading...",
  type = "spinner"
}: ModernLoadingProps) {
  const { isDark } = useTheme();

  if (fullScreen) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
        }}
      >
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {type === "spinner" && (
            <CircularProgress 
              size={60} 
              thickness={4} 
              sx={{ color: isDark ? "#3b82f6" : "#0d9ef8" }}
            />
          )}
          {type === "linear" && (
            <Box sx={{ width: '300px', mb: 3 }}>
              <LinearProgress 
                color="primary"
                sx={{ height: '8px', borderRadius: '4px' }}
              />
            </Box>
          )}
          <Typography
            variant="h6"
            mt={3}
            sx={{ 
              color: isDark ? "#cbd5e1" : "#64748b",
              fontWeight: 500
            }}
          >
            {message}
          </Typography>
          <Typography
            variant="body2"
            mt={1}
            sx={{ color: isDark ? "#94a3b8" : "#94a3b8" }}
          >
            Please wait while we prepare your dashboard
          </Typography>
        </m.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      {type === "spinner" && (
        <CircularProgress 
          size={40} 
          thickness={4}
          sx={{ color: isDark ? "#3b82f6" : "#0d9ef8", mb: 2 }}
        />
      )}
      {type === "linear" && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress 
            color="primary"
            sx={{ height: '6px', borderRadius: '3px' }}
          />
        </Box>
      )}
      {message && (
        <Typography
          variant="body2"
          sx={{ 
            color: isDark ? "#cbd5e1" : "#64748b",
            fontWeight: 500
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}
