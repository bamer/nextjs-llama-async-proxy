"use client";

import { Button, Box, Grid } from '@mui/material';
import { Refresh, RestartAlt, PlayArrow, Download } from '@mui/icons-material';

interface DashboardActionsProps {
  serverRunning: boolean;
  serverLoading: boolean;
  onRestart: () => void;
  onStart: () => void;
  onRefresh: () => void;
  onDownloadLogs: () => void;
}

/**
 * DashboardActions - Server action buttons
 */
export function DashboardActions({
  serverRunning,
  serverLoading,
  onRestart,
  onStart,
  onRefresh,
  onDownloadLogs,
}: DashboardActionsProps) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<RestartAlt />}
          onClick={onRestart}
          disabled={serverLoading}
          color={serverRunning ? 'warning' : 'primary'}
        >
          {serverLoading ? 'Restarting...' : 'Restart Server'}
        </Button>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={onStart}
          disabled={serverLoading || serverRunning}
          color="success"
        >
          {serverLoading ? 'Starting...' : 'Start Server'}
        </Button>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Download />}
          onClick={onDownloadLogs}
        >
          Download Logs
        </Button>
      </Grid>
    </Grid>
  );
}
