"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChart, Code, Cloud, Terminal } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

export function TechStack() {
  const { isDark } = useTheme();

  return (
    <Card
      sx={{
        background: isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(248, 250, 252, 0.5)",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2} textAlign="center">
          Built with Modern Technologies
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap", mb: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                p: 2,
                background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(13, 158, 248, 0.1)",
                borderRadius: "8px",
              }}
            >
              <BarChart sx={{ color: isDark ? "#3b82f6" : "#0d9ef8", fontSize: 32 }} />
            </Box>
            <Typography variant="caption" fontWeight="medium">
              Next.js
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                p: 2,
                background: isDark ? "rgba(168, 85, 247, 0.1)" : "rgba(168, 85, 247, 0.1)",
                borderRadius: "8px",
              }}
            >
              <Code sx={{ color: isDark ? "#a855f7" : "#a855f7", fontSize: 32 }} />
            </Box>
            <Typography variant="caption" fontWeight="medium">
              Material UI
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                p: 2,
                background: isDark ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.1)",
                borderRadius: "8px",
              }}
            >
              <Cloud sx={{ color: isDark ? "#22c55e" : "#22c55e", fontSize: 32 }} />
            </Box>
            <Typography variant="caption" fontWeight="medium">
              WebSocket
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                p: 2,
                background: isDark ? "rgba(234, 179, 8, 0.1)" : "rgba(234, 179, 8, 0.1)",
                borderRadius: "8px",
              }}
            >
              <Terminal sx={{ color: isDark ? "#eab308" : "#eab308", fontSize: 32 }} />
            </Box>
            <Typography variant="caption" fontWeight="medium">
              TypeScript
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Powered by modern web technologies for optimal performance and developer experience
        </Typography>
      </CardContent>
    </Card>
  );
}
