'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  icon,
  trend,
  trendLabel = 'vs last period',
  color = 'primary',
  className,
  onClick
}) => {
  const theme = useTheme();

  const getTrendIcon = () => {
    if (!trend) return <Remove fontSize="small" />;
    return trend > 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />;
  };

  const getTrendColor = () => {
    if (!trend) return theme.palette.text.secondary;
    return trend > 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const cardColor = theme.palette[color].main;
  const cardBgColor = alpha(cardColor, theme.palette.mode === 'dark' ? 0.1 : 0.05);

  return (
    <Card
      className={className}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        background: `linear-gradient(135deg, ${cardBgColor} 0%, ${alpha(cardColor, theme.palette.mode === 'dark' ? 0.05 : 0.02)} 100%)`,
        border: `1px solid ${alpha(cardColor, 0.2)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: alpha(cardColor, 0.4),
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              {title}
            </Typography>
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography
                variant="h4"
                component="span"
                sx={{
                  fontWeight: 700,
                  color: cardColor,
                  fontSize: '2rem'
                }}
              >
                {value}
              </Typography>
              {unit && (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500
                  }}
                >
                  {unit}
                </Typography>
              )}
            </Box>
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: alpha(cardColor, 0.1),
                color: cardColor,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {trend !== undefined && (
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={getTrendIcon()}
              label={`${trend > 0 ? '+' : ''}${trend}%`}
              size="small"
              sx={{
                backgroundColor: alpha(getTrendColor(), 0.1),
                color: getTrendColor(),
                border: `1px solid ${alpha(getTrendColor(), 0.2)}`,
                '& .MuiChip-icon': {
                  color: getTrendColor(),
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.75rem'
              }}
            >
              {trendLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};