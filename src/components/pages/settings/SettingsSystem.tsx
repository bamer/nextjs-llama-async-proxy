"use client";

import React from 'react';
import { Box, Typography, Slider, Card, CardContent } from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsSystemProps {
  settings: {
    maxConcurrentModels: number;
    refreshInterval: number;
  };
  onSliderChange: (
    key: 'maxConcurrentModels' | 'refreshInterval',
    value: number
  ) => void;
}

export function SettingsSystem({
  settings,
  onSliderChange,
}: SettingsSystemProps) {
  const { isDark } = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: 'text.primary' }}>
          System Settings
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" fontWeight="medium" sx={{ color: 'text.primary' }}>
              Max Concurrent Models
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
              {settings.maxConcurrentModels}
            </Typography>
          </Box>
          <Slider
            value={settings.maxConcurrentModels}
            onChange={(_, value) => onSliderChange('maxConcurrentModels', value as number)}
            min={1}
            max={10}
            step={1}
            sx={{
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)',
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">1 model</Typography>
            <Typography variant="caption" color="text.secondary">10 models</Typography>
          </Box>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" fontWeight="medium" sx={{ color: 'text.primary' }}>
              Refresh Interval (seconds)
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
              {settings.refreshInterval}s
            </Typography>
          </Box>
          <Slider
            value={settings.refreshInterval}
            onChange={(_, value) => onSliderChange('refreshInterval', value as number)}
            min={1}
            max={10}
            step={1}
            sx={{
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)',
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">1 second</Typography>
            <Typography variant="caption" color="text.secondary">10 seconds</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
