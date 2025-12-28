"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, Typography, Box, LinearProgress, Chip } from "@mui/material";
import { CircularGauge } from "./CircularGauge";

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  trend?: number;
  icon?: string;
  isDark: boolean;
  threshold?: number;
  showGauge?: boolean;
}

// Helper function defined outside component (created once)
const getStatusColor = (val: number, thresh: number): 'error' | 'warning' | 'success' => {
  if (val > thresh) return 'error';
  if (val > thresh * 0.7) return 'warning';
  return 'success';
};

const MemoizedMetricCard = memo(function MetricCard({
  title,
  value,
  unit = '',
  trend,
  icon,
  isDark,
  threshold = 80,
  showGauge = false
}: MetricCardProps) {
  // Memoize status color calculation
  const statusColor = useMemo(() => getStatusColor(value, threshold), [value, threshold]);

  // Memoize display value with unit
  const displayValue = useMemo(() => {
    const formattedValue = Number.isInteger(value) ? value : value.toFixed(1);
    return `${formattedValue}${unit}`;
  }, [value, unit]);

  // Memoize progress value (clamped to 0-100)
  const progressValue = useMemo(() => Math.min(100, Math.max(0, value)), [value]);

  // Memoize formatted value for progress
  const formattedValue = useMemo(() => Number.isInteger(value) ? value : value.toFixed(1), [value]);

  // Memoize status label
  const statusLabel = useMemo(() => {
    if (value > threshold) return 'High';
    if (value > threshold * 0.7) return 'Medium';
    return 'Normal';
  }, [value, threshold]);

  // Memoize trend label
  const trendLabel = useMemo(() => {
    if (trend === undefined) return null;
    return trend > 0 ? `+${trend}%` : `${trend}%`;
  }, [trend]);

  // Memoize trend color
  const trendColor = useMemo(() => {
    if (trend === undefined) return 'default';
    if (trend > 0) return 'error';
    if (trend < 0) return 'success';
    return 'default';
  }, [trend]);

  return (
    <Card sx={{
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      height: '100%',
      minHeight: 200,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.1)',
      },
    }}>
      <CardContent sx={{ padding: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon && <Typography sx={{ fontSize: '1.5rem' }}>{icon}</Typography>}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                {title}
              </Typography>
              {!showGauge && (
                <Typography variant="h4" fontWeight="bold">
                  {displayValue}
                </Typography>
              )}
            </Box>
          </Box>
          {trendLabel && (
            <Chip
              label={trendLabel}
              size="small"
              color={trendColor as any}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {showGauge ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 0 }}>
            <CircularGauge
              value={value}
              max={unit === '%' ? 100 : threshold * 2}
              unit={unit}
              label={title.split(' ')[0]}
              threshold={threshold}
              isDark={isDark}
              size={120}
            />
          </Box>
        ) : (
          <>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              color={statusColor}
              sx={{
                height: '8px',
                borderRadius: '4px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Chip
                label={statusLabel}
                size="small"
                color={statusColor}
                sx={{ height: 24 }}
              />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for fine-grained control
  // Only re-render if critical props change
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.unit === nextProps.unit &&
    prevProps.trend === nextProps.trend &&
    prevProps.icon === nextProps.icon &&
    prevProps.isDark === nextProps.isDark &&
    prevProps.threshold === nextProps.threshold &&
    prevProps.showGauge === nextProps.showGauge
  );
});

MemoizedMetricCard.displayName = 'MetricCard';

export { MemoizedMetricCard as MetricCard };
