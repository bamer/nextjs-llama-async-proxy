"use client";

import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip, useTheme, useMediaQuery } from "@mui/material";
import { Menu, DarkMode, LightMode, Settings, Notifications } from "@mui/icons-material";
import { useTheme as useAppTheme } from "@/contexts/theme-context";
import { WebSocketStatus } from "@/components/ui/websocket-status";
import { APP_CONFIG } from "@/config/app.config";
import { motion } from "framer-motion";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const theme = useTheme();
  const { toggleTheme, isDark } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: "64px" }}>
        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuToggle}
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
        )}

        {/* Logo and title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box display="flex" alignItems="center" flexGrow={1}>
            <Typography
              variant="h6"
              component="div"
              fontWeight="bold"
              color="primary"
            >
              {APP_CONFIG.name}
            </Typography>
            <Typography
              variant="caption"
              ml={1}
              color="text.secondary"
              sx={{ display: { xs: "none", md: "inline" } }}
            >
              v{APP_CONFIG.version}
            </Typography>
          </Box>
        </motion.div>

        {/* Action buttons */}
        <Box display="flex" alignItems="center" gap={1}>
          {/* WebSocket status */}
          <WebSocketStatus />

          {/* Theme toggle */}
          <Tooltip title={`Switch to ${isDark ? "light" : "dark"} mode`}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Notifications fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton color="inherit">
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}