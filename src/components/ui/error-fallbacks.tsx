"use client";

import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import { Refresh, Dashboard, Monitor, Memory, Description, Settings } from "@mui/icons-material";

export function DashboardFallback() {
  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Card
        sx={{
          maxWidth: 600,
          textAlign: "center",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 30px rgba(0, 0, 0, 0.3)"
              : "0 8px 30px rgba(0, 0, 0, 0.1)",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 41, 59, 0.8)"
              : "rgba(255, 255, 255, 0.95)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Dashboard sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Dashboard Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We encountered an error while loading the dashboard. Please try again.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={reloadPage}
            size="large"
          >
            Reload Dashboard
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export function MonitoringFallback() {
  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Card
        sx={{
          maxWidth: 600,
          textAlign: "center",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 30px rgba(0, 0, 0, 0.3)"
              : "0 8px 30px rgba(0, 0, 0, 0.1)",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 41, 59, 0.8)"
              : "rgba(255, 255, 255, 0.95)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Monitor sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Monitoring Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We encountered an error while loading system monitoring. Please try again.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={reloadPage}
            size="large"
          >
            Reload Monitoring
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export function ModelsFallback() {
  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Card
        sx={{
          maxWidth: 600,
          textAlign: "center",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 30px rgba(0, 0, 0, 0.3)"
              : "0 8px 30px rgba(0, 0, 0, 0.1)",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 41, 59, 0.8)"
              : "rgba(255, 255, 255, 0.95)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Memory sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Models Management Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We encountered an error while loading the models page. Please try again.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={reloadPage}
            size="large"
          >
            Reload Models
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export function LogsFallback() {
  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Card
        sx={{
          maxWidth: 600,
          textAlign: "center",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 30px rgba(0, 0, 0, 0.3)"
              : "0 8px 30px rgba(0, 0, 0, 0.1)",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 41, 59, 0.8)"
              : "rgba(255, 255, 255, 0.95)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Description sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Logs Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We encountered an error while loading the logs. Please try again.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={reloadPage}
            size="large"
          >
            Reload Logs
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export function SettingsFallback() {
  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Card
        sx={{
          maxWidth: 600,
          textAlign: "center",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 30px rgba(0, 0, 0, 0.3)"
              : "0 8px 30px rgba(0, 0, 0, 0.1)",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 41, 59, 0.8)"
              : "rgba(255, 255, 255, 0.95)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Settings sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Settings Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We encountered an error while loading the settings. Please try again.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={reloadPage}
            size="large"
          >
            Reload Settings
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
