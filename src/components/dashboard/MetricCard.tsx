"use client";

import { Card, CardContent, Typography, Box, LinearProgress, Chip } from "@mui/material";

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  trend?: number;
  icon?: string;
  isDark: boolean;
  threshold?: number;
}

export function MetricCard({
  title,
  value,
  unit = '',
  trend,
  icon,
  isDark,
  threshold = 80
}: MetricCardProps) {
  const getStatusColor = (val: number, thresh: number): string => {
    if (val > thresh) return 'error';
    if (val > thresh * 0.7) return 'warning';
    return 'success';
  };

  const statusColor = getStatusColor(value, threshold);

  return (
    <Card sx={{
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      height: '100%',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.1)',
      },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon && <Typography sx={{ fontSize: '1.5rem' }}>{icon}</Typography>}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {value.toFixed(1)}
                {unit}
              </Typography>
            </Box>
          </Box>
          {trend !== undefined && (
            <Chip
              label={trend > 0 ? `+${trend}%` : `${trend}%`}
              size="small"
              color={trend > 0 ? 'error' : trend < 0 ? 'success' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, value))}
          color={statusColor as any}
          sx={{
            height: '8px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Chip
            label={value > threshold ? 'High' : value > threshold * 0.7 ? 'Medium' : 'Normal'}
            size="small"
            color={statusColor as any}
            sx={{ height: 24 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
