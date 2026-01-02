"use client";

import { Typography, Card, CardContent, Grid } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { stats } from "../stats-data";

export function QuickStats() {
  const { isDark } = useTheme();

  return (
    <Card
      sx={{
        mb: 4,
        background: isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(248, 250, 252, 0.5)",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: "center" }}>
          Quick Stats
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          {stats.map((stat, index) => (
            <Grid key={index} size={{ xs: 6, sm: 3 }}>
              <Typography variant="h4" fontWeight="bold" color={stat.color}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
