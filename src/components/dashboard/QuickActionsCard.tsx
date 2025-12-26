"use client";

import { Card, CardContent, CardHeader, Typography, Box, Button, Grid } from "@mui/material";
import { Refresh, RestartAlt, Speed } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

interface QuickActionsCardProps {
  onRefresh: () => void;
  onRestart: () => void;
  onOptimize: () => void;
  loading?: boolean;
}

export function QuickActionsCard({ onRefresh, onRestart, onOptimize, loading = false }: QuickActionsCardProps) {
  const { isDark } = useTheme();

  return (
    <Card sx={{ 
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      height: '100%'
    }}>
      <CardHeader 
        title="Quick Actions"
        subheader="Common management tasks"
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Refresh />}
              onClick={onRefresh}
              disabled={loading}
              color="primary"
            >
              Refresh
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={onRestart}
              disabled={loading}
            >
              Restart Server
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Speed />}
              onClick={onOptimize}
              disabled={loading}
            >
              Optimize
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
