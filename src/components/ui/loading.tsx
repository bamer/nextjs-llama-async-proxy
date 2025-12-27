"use client";

import { CircularProgress, Box, Typography, LinearProgress } from "@mui/material";
import { m } from "framer-motion";

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  variant?: "circular" | "linear";
}

export function Loading({ fullScreen = false, message = "Loading...", variant = "circular" }: LoadingProps) {
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
          backgroundColor: "background.default",
        }}
      >
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {variant === "linear" ? (
            <>
              <Typography variant="h6" mb={2} color="text.secondary" sx={{ fontWeight: 500 }}>
                {message}
              </Typography>
              <LinearProgress sx={{ width: '60%', height: 8, borderRadius: 4 }} />
            </>
          ) : (
            <>
              <CircularProgress size={60} thickness={4} color="primary" />
              <Typography
                variant="h6"
                mt={3}
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                {message}
              </Typography>
            </>
          )}
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
        gap: 2,
      }}
    >
      {variant === "linear" ? (
        <>
          {message && (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {message}
            </Typography>
          )}
          <LinearProgress sx={{ width: '60%', height: 4, borderRadius: 2 }} />
        </>
      ) : (
        <>
          <CircularProgress size={40} thickness={4} color="primary" />
          {message && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {message}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}