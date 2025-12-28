"use client";

import { memo } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useLlamaServerStatus } from "@/lib/store";
import { useTheme } from "@/contexts/ThemeContext";

interface ServerStatusSectionProps {
  isDark: boolean;
}

function ServerStatusSection({ isDark }: ServerStatusSectionProps) {
  const llamaServerStatus = useLlamaServerStatus();
  const { isDark: themeIsDark } = useTheme();

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
            label={llamaServerStatus === 'running' ? 'RUNNING' : 'STOPPED'}
            color={llamaServerStatus === 'running' ? 'success' : 'default'}
            sx={{
              backgroundColor: llamaServerStatus === 'running'
                ? themeIsDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(25, 135, 84, 0.2)'
                : themeIsDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(97, 97, 97, 0.2)',
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
