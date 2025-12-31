"use client";

import { Box, Card, CardContent, Skeleton, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

export function SkeletonMetricCard({ icon }: { icon?: string }) {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  return (
    <Card sx={{ height: "100%", background: backgroundColor, backdropFilter: "blur(10px)", border: `1px solid ${borderColor}` }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          {icon && <Typography variant="h3" sx={{ mr: 1 }}>{icon}</Typography>}
          <Skeleton variant="text" sx={{ fontSize: "1.15rem", width: "40%" }} />
        </Box>
        <Skeleton variant="text" sx={{ fontSize: "2.75rem", width: "30%", mb: 2 }} />
        <Skeleton variant="rectangular" sx={{ height: 8, borderRadius: 1 }} />
      </CardContent>
    </Card>
  );
}

export function SkeletonTableRow({ rows = 3, columns = 4 }: { rows?: number; columns?: number }) {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(248, 250, 252, 0.5)";

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: "flex", alignItems: "center", p: 2, background: backgroundColor, borderRadius: 1, mb: 1 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" sx={{ fontSize: "0.875rem", width: "30%", mr: 2 }} />
          ))}
        </Box>
      ))}
    </>
  );
}

export function SkeletonLogEntry({ count = 5 }: { count?: number }) {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ mb: 2, background: backgroundColor, border: `1px solid ${borderColor}`, borderRadius: 1, p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Skeleton variant="rectangular" sx={{ width: 60, height: 20, borderRadius: 1 }} />
            <Skeleton variant="text" sx={{ fontSize: "0.7rem", width: 80 }} />
          </Box>
          <Skeleton variant="text" sx={{ fontSize: "0.875rem", width: "100%" }} />
        </Box>
      ))}
    </>
  );
}

export function SkeletonSettingsForm({ fields = 6 }: { fields?: number }) {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  return (
    <Box sx={{ p: 4, background: backgroundColor, backdropFilter: "blur(10px)", border: `1px solid ${borderColor}`, borderRadius: 2 }}>
      <Skeleton variant="text" sx={{ fontSize: "1.5rem", width: "40%", mb: 3 }} />
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Skeleton variant="text" sx={{ fontSize: "0.875rem", width: "25%", mb: 1 }} />
          <Skeleton variant="rectangular" sx={{ height: 56, borderRadius: 1 }} />
        </Box>
      ))}
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Skeleton variant="rectangular" sx={{ width: 120, height: 40, borderRadius: 1 }} />
        <Skeleton variant="rectangular" sx={{ width: 100, height: 40, borderRadius: 1 }} />
      </Box>
    </Box>
  );
}
