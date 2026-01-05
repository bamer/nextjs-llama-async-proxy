"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Slider,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider,
} from "@mui/material";
import {
  AutoAwesome,
  Folder,
  Storage,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  Home,
  Settings,
  Rocket,
  DarkMode,
  Notifications,
  Speed,
} from "@mui/icons-material";

const steps = ["Welcome", "Preferences", "Configuration", "Ready"];

interface SetupWizardProps {
  open: boolean;
  onClose: () => void;
}

export function SetupWizard({ open, onClose }: SetupWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [modelPath, setModelPath] = useState("");

  // Check if this is first run
  const [hasSeenWizard, setHasSeenWizard] = useState(true);
  useEffect(() => {
    const seen = localStorage.getItem("setup-wizard-seen");
    setHasSeenWizard(!!seen);
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFinish = useCallback(() => {
    // Save preferences to localStorage
    localStorage.setItem("setup-wizard-seen", "true");
    localStorage.setItem("user-preferences", JSON.stringify({
      darkMode,
      notifications,
      autoRefresh,
      refreshInterval,
    }));
    onClose();
  }, [darkMode, notifications, autoRefresh, refreshInterval, onClose]);

  const stepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <AutoAwesome sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Welcome to Llama Async Proxy
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
              This wizard will help you configure your local Llama server interface for optimal experience.
            </Typography>
            <Paper
              elevation={0}
              sx={{
                bgcolor: "action.hover",
                p: 2,
                borderRadius: 2,
                textAlign: "left",
              }}
            >
              <List dense>
                {[
                  { icon: <Settings />, text: "Set your interface preferences" },
                  { icon: <Folder />, text: "Configure model directory paths" },
                  { icon: <Speed />, text: "Optimize performance settings" },
                ].map((item, i) => (
                  <ListItem key={i}>
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Interface Preferences
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Customize your experience with these settings.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DarkMode fontSize="small" />
                    Dark Mode
                  </Box>
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mt: -2 }}>
                Use dark theme for better visibility in low-light environments
              </Typography>

              <Divider />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Notifications fontSize="small" />
                    Enable Notifications
                  </Box>
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mt: -2 }}>
                Get notified about server status changes and model updates
              </Typography>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Settings
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Configure how data is fetched and displayed.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Speed fontSize="small" />
                    Auto-Refresh Data
                  </Box>
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mt: -2 }}>
                Automatically update metrics and logs
              </Typography>

              {autoRefresh && (
                <Box sx={{ ml: 6 }}>
                  <Typography gutterBottom>
                    Refresh Interval: <strong>{refreshInterval} seconds</strong>
                  </Typography>
                  <Slider
                    value={refreshInterval}
                    onChange={(_, v) => setRefreshInterval(v as number)}
                    min={1}
                    max={30}
                    step={1}
                    marks={[
                      { value: 1, label: "1s" },
                      { value: 5, label: "5s" },
                      { value: 10, label: "10s" },
                      { value: 30, label: "30s" },
                    ]}
                  />
                </Box>
              )}

              <Divider />

              <TextField
                fullWidth
                label="Model Directory"
                placeholder="/path/to/your/models"
                value={modelPath}
                onChange={(e) => setModelPath(e.target.value)}
                helperText="Path to your .gguf model files (used for quick access)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Folder />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Rocket sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              You&apos;re All Set!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
              Your preferences have been saved. Click &quot;Finish&quot; to start using Llama Async Proxy.
            </Typography>

            <Paper
              elevation={0}
              sx={{
                bgcolor: "action.hover",
                p: 3,
                borderRadius: 2,
                textAlign: "left",
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Configuration Summary:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <DarkMode fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Theme"
                    secondary={darkMode ? "Dark Mode" : "Light Mode"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Notifications fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Notifications"
                    secondary={notifications ? "Enabled" : "Disabled"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Speed fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Auto-Refresh"
                    secondary={autoRefresh ? `Every ${refreshInterval}s` : "Disabled"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Folder fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Model Path"
                    secondary={modelPath || "Default"}
                  />
                </ListItem>
              </List>
            </Paper>

            <FormControlLabel
              control={<Switch defaultChecked onChange={(e) => {
                if (e.target.checked) {
                  localStorage.setItem("setup-wizard-seen", "true");
                }
              }} />}
              label="Show this wizard on next startup"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor:
                        activeStep >= index ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {index === 0 && <Home fontSize="small" />}
                    {index === 1 && <Settings fontSize="small" />}
                    {index === 2 && <Storage fontSize="small" />}
                    {index === 3 && <Rocket fontSize="small" />}
                  </Box>
                )}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 350 }}>
        {stepContent(activeStep)}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={activeStep === 0}>
          Skip
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowBack />}>
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={handleFinish} startIcon={<CheckCircle />}>
            Finish
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />}>
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
