"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, Typography, Box, Grid, Button, Divider, CircularProgress } from "@mui/material";
import { Download, PowerSettingsNew } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

interface QuickActionsCardProps {
  isDark: boolean;
  onDownloadLogs: () => void;
  onRestartServer: () => void;
  onStartServer: () => void;
  serverRunning?: boolean;
  serverLoading?: boolean;
}

function QuickActionsCard({
  isDark,
  onDownloadLogs,
  onRestartServer,
  onStartServer,
  serverRunning = false,
  serverLoading = false,
  downloading = false
}: QuickActionsCardProps) {
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
        icon: downloading ? <CircularProgress size={20} color="inherit" /> : <Download />,
        label: downloading ? 'Downloading...' : 'Download Logs',
        description: 'Export system logs',
        color: 'info',
        onClick: onDownloadLogs,
        disabled: downloading,
      },
    ];

    if (serverRunning) {
      baseActions.push({
        icon: <PowerSettingsNew />,
        label: 'Restart Server',
        description: 'Restart llama-server',
        color: 'warning',
        onClick: onRestartServer,
      });
    } else {
      baseActions.push({
        icon: <PowerSettingsNew />,
        label: serverLoading ? 'Starting...' : 'Start Server',
        description: 'Start llama-server',
        color: 'success',
        onClick: onStartServer,
        disabled: serverLoading,
      });
    }

    return baseActions;
  }, [downloading, serverRunning, serverLoading, onDownloadLogs, onRestartServer, onStartServer]);

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
                  p: 1.5,
                  textAlign: 'left',
                  borderRadius: 2,
                  background: index === 0 ? 'rgba(59, 130, 246, 0.2)' : undefined,
                  '&:hover': {
                    background: index === 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(13, 110, 253, 0.1)',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight="medium" sx={{ display: 'block', mb: 0.5 }}>
                    {action.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {action.description}
                  </Typography>
                </Box>
              </Button>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />

        <Box sx={{ p: 2, borderRadius: 2, background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(13, 110, 253, 0.1)' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Last Update
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {lastUpdate}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const MemoizedQuickActionsCard = memo(QuickActionsCard, (prev, next) => {
  return prev.isDark === next.isDark &&
         prev.downloading === next.downloading &&
         prev.serverRunning === next.serverRunning &&
         prev.serverLoading === next.serverLoading;
});

export default MemoizedQuickActionsCard;
