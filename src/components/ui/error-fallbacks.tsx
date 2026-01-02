"use client";

import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import { Refresh } from "@mui/icons-material";

const reloadPage = () => {
  window.location.reload();
};

interface ErrorFallbackProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  buttonLabel: string;
}

const ErrorFallback = ({ icon, title, message, buttonLabel }: ErrorFallbackProps) => (
  <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <Card
      sx={{
        maxWidth: 600,
        textAlign: 'center',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 8px 30px rgba(0, 0, 0, 0.3)'
            : '0 8px 30px rgba(0, 0, 0, 0.1)',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(30, 41, 59, 0.8)'
            : 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {icon}
        <Typography variant="h5" gutterBottom fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          onClick={reloadPage}
          size="large"
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  </Box>
);

export function DashboardFallback() {
  return (
    <ErrorFallback
      icon={<Typography component="span" sx={{ fontSize: 64, color: 'error.main', mb: 2 }}>📊</Typography>}
      title="Dashboard Unavailable"
      message="We encountered an error while loading dashboard. Please try again."
      buttonLabel="Reload Dashboard"
    />
  );
}

export function MonitoringFallback() {
  return (
    <ErrorFallback
      icon={<Typography component="span" sx={{ fontSize: 64, color: 'error.main', mb: 2 }}>📈</Typography>}
      title="Monitoring Unavailable"
      message="We encountered an error while loading system monitoring. Please try again."
      buttonLabel="Reload Monitoring"
    />
  );
}

export function ModelsFallback() {
  return (
    <ErrorFallback
      icon={<Typography component="span" sx={{ fontSize: 64, color: 'error.main', mb: 2 }}>🧠</Typography>}
      title="Models Management Unavailable"
      message="We encountered an error while loading models page. Please try again."
      buttonLabel="Reload Models"
    />
  );
}

export function LogsFallback() {
  return (
    <ErrorFallback
      icon={<Typography component="span" sx={{ fontSize: 64, color: 'error.main', mb: 2 }}>📝</Typography>}
      title="Logs Unavailable"
      message="We encountered an error while loading logs. Please try again."
      buttonLabel="Reload Logs"
    />
  );
}

export function SettingsFallback() {
  return (
    <ErrorFallback
      icon={<Typography component="span" sx={{ fontSize: 64, color: 'error.main', mb: 2 }}>⚙️</Typography>}
      title="Settings Unavailable"
      message="We encountered an error while loading settings. Please try again."
      buttonLabel="Reload Settings"
    />
  );
}
