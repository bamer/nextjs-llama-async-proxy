"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { m } from "framer-motion";

export function LoadingFallback() {
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <CircularProgress size={60} thickness={4} color="primary" />
        <Typography
          variant="h6"
          mt={3}
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Loading Llama Runner Pro...
        </Typography>
        <Typography
          variant="body2"
          mt={1}
          color="text.disabled"
        >
          Please wait while we prepare your dashboard
        </Typography>
      </m.div>
    </Box>
  );
}