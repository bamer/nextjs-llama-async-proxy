"use client";

import React from 'react';
import { Typography, Card, CardContent, Button, Grid } from '@mui/material';
import { LightMode, DarkMode, SettingsSuggest } from '@mui/icons-material';

interface SettingsAppearanceProps {
  settings: {
    theme: 'light' | 'dark' | 'system';
  };
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export function SettingsAppearance({
  settings,
  onThemeChange,
}: SettingsAppearanceProps) {
  const themes = [
    { value: 'light' as const, label: 'Light' },
    { value: 'dark' as const, label: 'Dark' },
    { value: 'system' as const, label: 'System' },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: 'text.primary' }}>
          Appearance
        </Typography>

        <Grid container spacing={2}>
          {themes.map((theme) => (
            <Grid size={{ xs: 12, sm: 4 }} key={theme.value}>
              <Button
                onClick={() => onThemeChange(theme.value)}
                fullWidth
                sx={{
                  p: 3,
                  border: 2,
                  borderColor: settings.theme === theme.value ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  backgroundColor: settings.theme === theme.value ? 'action.selected' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'none',
                }}
              >
                <Typography variant="body1" fontWeight={settings.theme === theme.value ? 'medium' : 'normal'} color={settings.theme === theme.value ? 'primary.main' : 'text.primary'}>
                  {theme.label}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
