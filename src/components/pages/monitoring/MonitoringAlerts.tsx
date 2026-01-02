'use client';

import { Box, Typography, Paper } from '@mui/material';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface MonitoringAlertsProps {
  logs: LogEntry[];
}

const getLogLevelColor = (level: string) => {
  switch (level) {
    case 'error': return 'error.main';
    case 'warn': return 'warning.main';
    case 'info': return 'info.main';
    case 'debug': return 'text.secondary';
    default: return 'text.primary';
  }
};

export const MonitoringAlerts = ({ logs }: MonitoringAlertsProps) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <Typography variant="h6" gutterBottom>
        Live Logs
      </Typography>
      <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 2, borderRadius: 2, backgroundColor: 'background.paper' }}>
        {logs.length === 0 ? (
          <Typography>No logs available...</Typography>
        ) : (
          logs.map((log: LogEntry, index: number) => (
            <Box key={index} sx={{ mb: 1, display: 'flex', gap: 1 }}>
              <Typography component="span" sx={{ color: getLogLevelColor(log.level) }}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </Typography>
              <Typography>{log.message}</Typography>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
};
