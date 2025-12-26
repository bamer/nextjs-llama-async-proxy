"use client";

import { Card, CardContent, Typography, LinearProgress, Grid, Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface GpuMetricsCardProps {
  label: string;
  value: string;
  percentage: number;
  color: "error" | "warning" | "success";
  subtext?: string;
  unit?: string;
  isDark: boolean;
}

export function GpuMetricsCard({
  label,
  value,
  percentage,
  color = 'success',
  subtext,
  unit = '%',
  isDark
}: GpuMetricsCardProps) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Box
        sx={{
          p: 2,
          background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
          borderRadius: 2,
        }}
      >
        <Typography variant="caption" fontWeight="medium" gutterBottom>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="h6" fontWeight="bold">
            {value}{unit}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={color as any}
          sx={{
            height: '6px',
            borderRadius: '3px',
            mb: 0.5,
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        />
        {subtext && (
          <Typography variant="caption" color="text.secondary">
            {subtext}
          </Typography>
        )}
      </Box>
    </Grid>
  );
}
