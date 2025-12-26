import { Card, CardContent, Typography, LinearProgress, Grid } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface GpuMetricsCardProps {
  label: string;
  value: string;
  unit?: string;
  percentage: number;
  color?: "error" | "warning" | "success";
  subtext?: string;
}

export function GpuMetricsCard({
  label,
  value,
  unit,
  percentage,
  color = "success",
  subtext,
}: GpuMetricsCardProps): React.ReactNode {
  const { isDark } = useTheme();

  return (
    <Card
      sx={{
        background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}`,
        height: "100%",
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value} {unit}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={color}
          sx={{ height: "6px", borderRadius: "3px", mt: 1 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {subtext}
        </Typography>
      </CardContent>
    </Card>
  );
}
