"use client";

import { m } from "framer-motion";
import { Box, Typography, Button } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <Box sx={{ textAlign: "center", py: 2 }}>
      {/* Llama mascot with waving animation */}
      <Box
        component={m.div}
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        sx={{ mb: 3 }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            fontSize: 50,
          }}
        >
          🦙
        </Box>
      </Box>

      <Typography variant="h5" gutterBottom>
        Welcome to Llama Async Proxy
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
        Your powerful async proxy for LLM inference with real-time monitoring and streaming capabilities.
      </Typography>

      <Box
        sx={{
          bgcolor: "action.hover",
          borderRadius: 2,
          p: 3,
          mb: 3,
          textAlign: "left",
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          What you&apos;ll get:
        </Typography>
        {[
          { icon: "🔍", text: "Automatic model discovery and scanning" },
          { icon: "⚡", text: "Real-time performance monitoring" },
          { icon: "🌊", text: "Streaming responses for faster interaction" },
          { icon: "🎛️", text: "Configurable model parameters" },
        ].map((item, index) => (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
          >
            <Box sx={{ fontSize: 20 }}>{item.icon}</Box>
            <Typography variant="body2">{item.text}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button
          variant="contained"
          size="large"
          onClick={onNext}
          startIcon={<AutoAwesomeIcon />}
        >
          Get Started
        </Button>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 2, cursor: "pointer" }}
      >
        You can skip this setup and configure later
      </Typography>
    </Box>
  );
}
