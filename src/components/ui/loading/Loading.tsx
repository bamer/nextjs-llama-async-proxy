"use client";

import { Box, CircularProgress, Typography, LinearProgress } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface LoadingProps {
  message?: string;
  variant?: "circular" | "linear" | "skeleton";
  fullPage?: boolean;
  size?: number;
}

export function Loading({
  message = "Loading...",
  variant = "circular",
  fullPage = false,
  size = 40,
}: LoadingProps) {
  const { isDark } = useTheme();

  if (fullPage) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          p: 4,
          background: isDark
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mb: 3,
            fontWeight: "bold",
            color: isDark ? "#f1f5f9" : "#0f172a",
          }}
        >
          {message}
        </Typography>
        {variant === "circular" && (
          <CircularProgress
            size={60}
            sx={{
              color: isDark ? "#60a5fa" : "#3b82f6",
            }}
          />
        )}
        {variant === "linear" && (
          <Box sx={{ width: "50%", maxWidth: 400 }}>
            <LinearProgress
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              }}
            />
          </Box>
        )}
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
        p: 4,
        minHeight: "50vh",
      }}
    >
      {variant === "circular" && (
        <CircularProgress
          size={size}
          sx={{
            color: isDark ? "#60a5fa" : "#3b82f6",
            mb: 2,
          }}
        />
      )}
      {variant === "linear" && (
        <Box sx={{ width: "50%", maxWidth: 400, mb: 2 }}>
          <LinearProgress
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            }}
          />
        </Box>
      )}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          fontWeight: 500,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}
