"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, Typography, Box, Chip, Chip } from "@mui/material";
import { useLlamaServerStatus } from "@/hooks/use-websocket";
import { useTheme } from "@/contexts/ThemeContext";

interface ServerStatusSectionProps {
  isDark: boolean;
}

function ServerStatusSection({ isDark }: ServerStatusSectionProps) {
  const llamaServerStatus = useLlamaServerStatus();
  const { isDark: themeIsDark } = useTheme();

  const statusConfig = useMemo(() => {
    if (llamaServerStatus === 'running') {
      return {
        label: 'RUNNING',
        color: 'success',
        bgColor: 'success.main',
        chipColor: themeIsDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(25, 135, 84, 0.2)',
        showStartButton: false,
        showStopButton: true,
      };
    } else if (llamaServerStatus === 'loading') {
      return {
        label: 'LOADING',
        color: 'warning',
        bgColor: 'warning.main',
        chipColor: themeIsDark ? 'rgba(251, 146, 60, 0.2)' : 'rgba(234, 179, 8, 0.2)',
        showStartButton: false,
        showStopButton: false,
      };
    } else {
      return {
        label: 'STOPPED',
        color: 'default',
        bgColor: 'default',
        chipColor: themeIsDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(97, 97, 97, 0.2)',
        showStartButton: true,
        showStopButton: false,
      };
    }
  }, [llamaServerStatus, themeIsDark]);

  return (
    <Card sx={{
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      borderRadius: 2,
      mb: 2,
    }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          Server Status
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={statusConfig.label}
            color={statusConfig.color}
            sx={{
              backgroundColor: statusConfig.chipColor,
              color: isDark ? '#fff' : '#000',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: 28,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Llama Server {llamaServerStatus === 'running' ? 'is running' : 'is not running'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

ServerStatusSection.displayName = 'ServerStatusSection';

export default memo(ServerStatusSection);
