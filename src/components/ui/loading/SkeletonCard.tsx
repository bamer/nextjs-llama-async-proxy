"use client";

import { Box, Skeleton } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface SkeletonCardProps {
  count?: number;
  height?: number;
}

export function SkeletonCard({ count = 1, height = 200 }: SkeletonCardProps) {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 3,
            background: backgroundColor,
            backdropFilter: "blur(10px)",
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            height,
          }}
        >
          <Skeleton
            variant="text"
            sx={{
              fontSize: "1.25rem",
              width: "60%",
              mb: 2,
            }}
          />
          <Skeleton
            variant="rectangular"
            sx={{
              height: 60,
              mb: 2,
              borderRadius: 1,
            }}
          />
          <Skeleton
            variant="rectangular"
            sx={{
              height: 8,
              width: "40%",
              borderRadius: 1,
            }}
          />
        </Box>
      ))}
    </>
  );
}
