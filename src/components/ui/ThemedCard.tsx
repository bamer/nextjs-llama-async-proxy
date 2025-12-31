"use client";

import type { ReactNode } from "react";
import { Card, CardContent, Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

export interface ThemedCardProps {
  children: ReactNode;
  variant?: "default" | "gradient" | "glass";
  className?: string;
  sx?: object;
}

export function ThemedCard({
  children,
  variant = "default",
  className,
  sx,
}: ThemedCardProps): ReactNode {
  const { isDark } = useTheme();

  const getCardStyles = (): object => {
    const baseStyles = {
      borderRadius: 2,
      transition: "all 0.3s ease",
      ...(sx || {}),
    };

    switch (variant) {
      case "gradient":
        return {
          ...baseStyles,
          background: isDark
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          boxShadow: isDark
            ? "0 8px 30px rgba(0, 0, 0, 0.3)"
            : "0 8px 30px rgba(0, 0, 0, 0.1)",
        };

      case "glass":
        return {
          ...baseStyles,
          background: isDark
            ? "rgba(30, 41, 59, 0.6)"
            : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
            : "0 8px 32px rgba(0, 0, 0, 0.1)",
        };

      case "default":
      default:
        return {
          ...baseStyles,
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: isDark
            ? "0 4px 20px rgba(0, 0, 0, 0.25)"
            : "0 4px 20px rgba(0, 0, 0, 0.08)",
        };
    }
  };

  return (
    <Card {...(className ? { className } : {})} sx={getCardStyles()}>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Card>
  );
}
