"use client";

import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export function GettingStarted() {
  const { isDark } = useTheme();

  return (
    <Box sx={{ mt: 6 }}>
      <Card
        sx={{
          background: isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(248, 250, 252, 0.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Getting Started
          </Typography>
          <Typography variant="body1" paragraph>
            New to Llama Runner Pro? Here are some steps to help you get started:
          </Typography>
          <Box component="ol" sx={{ pl: 2, mb: 3 }}>
            <li>Connect your AI models through the settings</li>
            <li>Configure model parameters and settings</li>
            <li>Start monitoring real-time performance</li>
            <li>Analyze metrics and optimize your setup</li>
          </Box>
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              href="/docs"
              sx={{ borderRadius: "8px" }}
            >
              View Documentation
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
