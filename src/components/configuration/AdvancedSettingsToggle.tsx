"use client";

import { useState } from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

export interface AdvancedSettingsToggleProps {
  onToggle: (showAdvanced: boolean) => void;
  initialShowAdvanced?: boolean;
}

export function AdvancedSettingsToggle({
  onToggle,
  initialShowAdvanced = false
}: AdvancedSettingsToggleProps) {
  const [showAdvanced, setShowAdvanced] = useState(initialShowAdvanced);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setShowAdvanced(checked);
    onToggle(checked);
  };

  return (
    <Box sx={{ 
      p: 2, 
      mb: 2, 
      borderRadius: '8px',
      backgroundColor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <FormControlLabel
        control={
          <Switch
            checked={showAdvanced}
            onChange={handleToggle}
            color="warning"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Show Advanced Settings
            </Typography>
            <InfoOutlined 
              sx={{ fontSize: '1rem', color: 'text.secondary' }}
              titleAccess="Toggle advanced configuration options"
            />
          </Box>
        }
        sx={{ mx: 0 }}
      />
      {showAdvanced && (
        <Typography 
          variant="body2"
          sx={{ mt: 1, color: 'warning.dark', pl: 6, fontStyle: 'italic' }}
        >
          Advanced settings are for experienced users only
        </Typography>
      )}
    </Box>
  );
}