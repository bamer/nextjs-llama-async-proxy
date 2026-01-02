"use client";

import { Box, Typography, Button } from "@mui/material";
import { Rocket } from "@mui/icons-material";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export function HeroSection() {
  const { isDark } = useTheme();

  return (
    <Box textAlign="center" mb={6}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)"
            : "linear-gradient(135deg, #0d9ef8 0%, #a855f7 100%)",
          boxShadow: isDark
            ? "0 8px 30px rgba(59, 130, 246, 0.3)"
            : "0 8px 30px rgba(13, 158, 248, 0.3)",
          mb: 3,
        }}
      >
        <Rocket sx={{ color: "white", fontSize: 40 }} />
      </Box>

      <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
        Welcome to Llama Runner Pro
      </Typography>
      <Typography variant="h5" color="text.secondary" maxWidth="800px" mx="auto" mb={4}>
        The ultimate platform for managing and monitoring your AI models with real-time data and advanced
        analytics
      </Typography>
      <Button
        variant="contained"
        size="large"
        color="primary"
        component={Link}
        href="/dashboard"
        sx={{
          fontWeight: "bold",
          px: 4,
          py: 1.5,
          borderRadius: "8px",
          boxShadow: isDark
            ? "0 4px 12px rgba(59, 130, 246, 0.3)"
            : "0 4px 12px rgba(13, 158, 248, 0.3)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: isDark
              ? "0 6px 20px rgba(59, 130, 246, 0.4)"
              : "0 6px 20px rgba(13, 158, 248, 0.4)",
          },
        }}
      >
        Get Started
      </Button>
    </Box>
  );
}
