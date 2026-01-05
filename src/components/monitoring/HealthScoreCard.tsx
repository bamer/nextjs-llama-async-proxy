"use client";

import MuiCard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export type HealthStatus = "excellent" | "good" | "poor";

export interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warning";
}

export interface HealthScoreCardProps {
  score: number;
  healthStatus: HealthStatus;
  checks: HealthCheck[];
}

const statusConfig: Record<HealthStatus, { color: string; bgColor: string; label: string }> = {
  excellent: { color: "#2e7d32", bgColor: "#e8f5e9", label: "Excellent" },
  good: { color: "#ed6c02", bgColor: "#fff3e0", label: "Good" },
  poor: { color: "#d32f2f", bgColor: "#ffebee", label: "Needs Attention" },
};

const scoreColors: Record<HealthStatus, string> = {
  excellent: "#4caf50",
  good: "#ff9800",
  poor: "#f44336",
};

const icons = {
  pass: <CheckCircleOutlineIcon sx={{ color: "#2e7d32", fontSize: 20 }} />,
  fail: <ErrorOutlineIcon sx={{ color: "#d32f2f", fontSize: 20 }} />,
  warning: <WarningAmberIcon sx={{ color: "#ed6c02", fontSize: 20 }} />,
};

export function HealthScoreCard({ score, healthStatus, checks }: HealthScoreCardProps) {
  const { color, bgColor, label } = statusConfig[healthStatus];
  const progressColor = scoreColors[healthStatus];

  return (
    <MuiCard sx={{ borderLeft: "4px solid", borderColor: progressColor, backgroundColor: "background.paper" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress variant="determinate" value={score} size={80} thickness={4} sx={{ color: progressColor }} />
            <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1 }}>{score}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Score</Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Health Score</Typography>
            <Box sx={{ display: "inline-flex", px: 1.5, py: 0.5, borderRadius: 1, backgroundColor: bgColor }}>
              <Typography variant="body2" sx={{ color, fontWeight: 500 }}>{label}</Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1.5, fontWeight: 600 }}>Health Checks</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {checks.map((check, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {icons[check.status]}
              <Typography variant="body2">{check.name}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </MuiCard>
  );
}
