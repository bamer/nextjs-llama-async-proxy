import { Box, Typography, Chip, IconButton, Tooltip, CircularProgress } from "@mui/material";
import { Refresh, Settings as SettingsIcon, CloudUpload } from "@mui/icons-material";
import { m } from "framer-motion";
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
}

export function DashboardHeader({
  isConnected,
  connectionState = 'disconnected',
  reconnectionAttempts = 0,
  metrics,
  onRefresh,
  refreshing = false
}: DashboardHeaderProps): React.ReactNode {
  const { isDark } = useTheme();
  const router = useRouter();

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

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
              fontWeight: "bold",
              animation:
                !isConnected && connectionState !== 'reconnecting'
                  ? "pulse 2s infinite"
                  : connectionState === 'reconnecting'
                  ? "pulse 1s infinite"
                  : "none",
              "@keyframes pulse": {
                "0%": { boxShadow: "0 0 0 rgba(255, 82, 82, 0.7)" },
                "70%": { boxShadow: "0 0 10px rgba(255, 82, 82, 0)" },
                "100%": { boxShadow: "0 0 0 rgba(255, 82, 82, 0)" },
              },
            }}
          />
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
