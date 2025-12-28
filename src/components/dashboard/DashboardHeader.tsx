import { Box, Typography, Chip, IconButton, Tooltip, CircularProgress, Button } from "@mui/material";
import { Refresh, Settings as SettingsIcon, PowerSettingsNew } from "@mui/icons-material";
import { m } from "framer-motion";
import { memo, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  isConnected: boolean;
  connectionState?: string;
  reconnectionAttempts?: number;
  metrics?: {
    serverStatus?: string;
    cpuUsage?: number;
    memoryUsage?: number;
    uptime?: number;
  } | undefined;
  onRefresh?: () => void;
  refreshing?: boolean;
  onRestartServer?: () => void;
  onStartServer?: () => void;
  serverRunning?: boolean;
  serverLoading?: boolean;
}

// Static styles for connection chip animation
const connectionChipSx = {
  fontWeight: "bold",
  "@keyframes pulse": {
    "0%": { boxShadow: "0 0 0 rgba(255, 82, 82, 0.7)" },
    "70%": { boxShadow: "0 0 10px rgba(255, 82, 82, 0)" },
    "100%": { boxShadow: "0 0 0 rgba(255, 82, 82, 0)" },
  },
};

function DashboardHeader({
  isConnected,
  connectionState = 'disconnected',
  reconnectionAttempts = 0,
  metrics,
  onRefresh,
  refreshing = false,
  onRestartServer,
  onStartServer,
  serverRunning = false,
  serverLoading = false
}: DashboardHeaderProps): React.ReactNode {
  const { isDark } = useTheme();
  const router = useRouter();

  const formatUptime = useCallback((seconds?: number): string => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  }, []);

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" component="h1" fontWeight="bold">
            Llama Runner Pro Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time AI Model Management & Monitoring
          </Typography>
        </m.div>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {metrics && (
            <Chip
              label={`Uptime: ${formatUptime(metrics.uptime)}`}
              color="info"
              size="small"
              variant="outlined"
            />
          )}
          <Chip
            label={
              connectionState === 'reconnecting'
                ? `RECONNECTING (${reconnectionAttempts}/${5})...`
                : connectionState === 'error'
                ? "CONNECTION ERROR"
                : isConnected
                ? "CONNECTED"
                : "DISCONNECTED"
            }
            color={
              connectionState === 'reconnecting'
                ? "warning"
                : connectionState === 'error'
                ? "error"
                : isConnected
                ? "success"
                : "error"
            }
            size="small"
            variant="filled"
            sx={{
              ...connectionChipSx,
              animation:
                !isConnected && connectionState !== 'reconnecting'
                  ? "pulse 2s infinite"
                  : connectionState === 'reconnecting'
                  ? "pulse 1s infinite"
                  : "none",
            }}
          />
          {onRestartServer && (
            <Tooltip title="Restart Server">
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<PowerSettingsNew />}
                onClick={onRestartServer}
                disabled={serverLoading}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                Restart
              </Button>
            </Tooltip>
          )}
          {onStartServer && (
            <Tooltip title={serverRunning ? "Stop Server" : "Start Server"}>
              <Button
                size="small"
                variant="outlined"
                color={serverRunning ? "error" : "success"}
                startIcon={<PowerSettingsNew />}
                onClick={onStartServer}
                disabled={serverLoading}
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                {serverLoading
                  ? (serverRunning ? 'Stopping...' : 'Starting...')
                  : (serverRunning ? 'Stop' : 'Start')
                }
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={onRefresh} color="primary" disabled={refreshing}>
              {refreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Open Settings">
            <IconButton onClick={() => router.push('/settings')} color="secondary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </>
  );
}

const MemoizedDashboardHeader = memo(DashboardHeader, (prev, next) => {
  return prev.isConnected === next.isConnected &&
         prev.connectionState === next.connectionState &&
         prev.reconnectionAttempts === next.reconnectionAttempts &&
         prev.metrics?.uptime === next.metrics?.uptime &&
         prev.onRefresh === next.onRefresh &&
         prev.refreshing === next.refreshing &&
         prev.onRestartServer === next.onRestartServer &&
         prev.onStartServer === next.onStartServer &&
         prev.serverRunning === next.serverRunning &&
         prev.serverLoading === next.serverLoading;
});

export default MemoizedDashboardHeader;
