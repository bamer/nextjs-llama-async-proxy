"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, Typography, Box, Grid, Button } from "@mui/material";
import { PowerSettingsNew } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

interface QuickActionsCardProps {
  isDark: boolean;
  onRestartServer: () => void;
  onStartServer: () => void;
  serverRunning?: boolean;
  serverLoading?: boolean;
}

function QuickActionsCard({
  isDark,
  onRestartServer,
  onStartServer,
  serverRunning = false,
  serverLoading = false
}: QuickActionsCardProps) {
  const { isDark: themeIsDark } = useTheme();

  const actions = useMemo<Array<{
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
    onClick: () => void;
    disabled?: boolean;
  }>>(() => {
    const baseActions: Array<{
      icon: React.ReactNode;
      label: string;
      description: string;
      color: string;
      onClick: () => void;
      disabled?: boolean;
    }> = [
      {
        icon: <PowerSettingsNew />,
        label: 'Restart Server',
        description: 'Restart llama-server',
        color: 'warning',
        onClick: onRestartServer,
      },
      {
        icon: <PowerSettingsNew />,
        label: serverLoading ? 'Starting...' : 'Start Server',
        description: 'Start llama-server',
        color: 'success',
        onClick: onStartServer,
        disabled: serverLoading,
      },
    ];

    return baseActions;
  }, [serverRunning, serverLoading, onRestartServer, onStartServer, themeIsDark]);

  const lastUpdate = useMemo(() => new Date().toLocaleString(), []);

  return (
    <Card sx={{
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      height: '100%',
    }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Server Actions
        </Typography>

        <Grid container spacing={2}>
          {actions.map((action, index) => (
            <Grid size={{ xs: 12 }} key={index}>
              <Button
                fullWidth
                variant={index === 0 ? 'contained' : 'outlined'}
                color={action.color as any}
                startIcon={action.icon}
                onClick={action.onClick}
                disabled={(action as any).disabled || false}
                sx={{
                  justifyContent: 'flex-start',
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

QuickActionsCard.displayName = 'QuickActionsCard';

export default memo(QuickActionsCard);
