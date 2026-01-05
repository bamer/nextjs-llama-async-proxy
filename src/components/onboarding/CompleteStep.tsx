"use client";

import { m } from "framer-motion";
import { Box, Typography, Button, Paper, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";

interface CompleteStepProps {
  onFinish: () => void;
}

const TIPS = [
  "Use streaming mode for faster response perception",
  "Lower temperature (0.1-0.3) for more consistent outputs",
  "Increase context size for longer conversations",
  "GPU acceleration requires CUDA-compatible hardware",
  "Monitor memory usage to avoid out-of-memory errors",
];

// Use a deterministic index based on a simple hash of the current hour
function getTipIndex(): number {
  const hour = new Date().getHours();
  return hour % TIPS.length;
}

export function CompleteStep({ onFinish }: CompleteStepProps) {
  const randomTip = TIPS[getTipIndex()];

  return (
    <Box sx={{ textAlign: "center", py: 2 }}>
      {/* Celebration Animation */}
      <Box
        component={m.div}
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, -5, 5, -5, 0] }}
        transition={{ type: "spring", duration: 0.8 }}
        sx={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          bgcolor: "success.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
          fontSize: 50,
          boxShadow: "0 0 0 8px rgba(76, 175, 80, 0.2)",
        }}
      >
        🦙
      </Box>

      <Typography variant="h4" gutterBottom>
        Setup Complete!
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        You&apos;re all set to start using Llama Async Proxy
      </Typography>

      {/* Success Checkmarks */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 4 }}>
        {[
          { icon: "🔍", text: "Models Scanned" },
          { icon: "⚙️", text: "Settings Configured" },
          { icon: "🚀", text: "Ready to Go" },
        ].map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              component={m.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "success.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                mb: 1,
              }}
            >
              {item.icon}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.text}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Tip of the Day */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "warning.light",
          color: "warning.dark",
          borderRadius: 2,
          p: 2,
          mb: 4,
          textAlign: "left",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <TipsAndUpdatesIcon sx={{ mt: 0.5, flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Tip of the Day
            </Typography>
            <Typography variant="body2">{randomTip}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Links */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "action.hover",
          borderRadius: 2,
          p: 2,
          mb: 4,
          textAlign: "left",
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          What&apos;s next?
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Start your first model from the Dashboard"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Explore configuration options in Settings"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText
              primary="View logs and monitoring data in real-time"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItem>
        </List>
      </Paper>

      {/* Finish Button */}
      <Button
        variant="contained"
        size="large"
        onClick={onFinish}
        startIcon={<RocketLaunchIcon />}
        sx={{
          px: 4,
          py: 1.5,
          borderRadius: 3,
        }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
}
