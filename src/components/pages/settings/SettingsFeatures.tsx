"use client";

import React from 'react';
import { Box, Typography, Card, CardContent, Switch, FormControlLabel } from '@mui/material';

interface SettingsFeaturesProps {
  settings: {
    autoUpdate: boolean;
    notificationsEnabled: boolean;
  };
  onToggle: (key: 'autoUpdate' | 'notificationsEnabled') => void;
}

export function SettingsFeatures({
  settings,
  onToggle,
}: SettingsFeaturesProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: 'text.primary' }}>
          Features
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              backgroundColor: 'action.hover',
            }}
          >
            <Box>
              <Typography variant="body1" fontWeight="medium" sx={{ color: 'text.primary' }}>
                Auto Update
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Auto-update models and dependencies
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoUpdate}
                  onChange={() => onToggle('autoUpdate')}
                  color="primary"
                />
              }
              label=""
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              backgroundColor: 'action.hover',
            }}
          >
            <Box>
              <Typography variant="body1" fontWeight="medium" sx={{ color: 'text.primary' }}>
                Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Receive system alerts
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationsEnabled}
                  onChange={() => onToggle('notificationsEnabled')}
                  color="primary"
                />
              }
              label=""
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
