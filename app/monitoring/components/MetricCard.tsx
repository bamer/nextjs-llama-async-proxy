"use client";

import { Box, Card, CardContent, LinearProgress, Chip, Typography } from "@mui/material";
import { Memory, Computer, Storage, NetworkCheck } from "@mui/icons-material";
import { getStatusColor } from "../utils/monitoring-utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: "Memory" | "Computer" | "Storage" | "NetworkCheck";
  color: "primary" | "secondary" | "success" | "info";
  threshold?: number;
  progress?: number;
  label?: string;
  isDark: boolean;
}

const iconMap = {
  Memory,
  Computer,
  Storage,
  NetworkCheck,
};

export function MetricCard({
  title,
  value,
  unit = "",
  icon,
  color,
  threshold,
  progress,
  label,
  isDark,
}: MetricCardProps) {
  const IconComponent = iconMap[icon];
  const displayValue = typeof value === "number" ? `${value}${unit}` : value;
  const progressValue = progress ?? (typeof value === "number" ? value : 0);
  const statusColor = threshold !== undefined ? getStatusColor(progressValue, threshold) : color;
  const chipLabel = label ?? (threshold !== undefined
    ? (progressValue > threshold ? "High" : progressValue > threshold * 0.7 ? "Medium" : "Normal")
    : "");

  return (
    <Card sx={{
      background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
      backdropFilter: "blur(10px)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <IconComponent color={color} sx={{ mr: 1, fontSize: "2rem" }} />
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" fontWeight="bold" mb={1}>
          {displayValue}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          color={statusColor}
          sx={{ height: "8px", borderRadius: "4px", mb: 1 }}
        />
        {chipLabel && (
          <Chip
            label={chipLabel}
            color={statusColor}
            size="small"
          />
        )}
      </CardContent>
    </Card>
  );
}
