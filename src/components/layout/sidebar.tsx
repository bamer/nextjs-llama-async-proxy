"use client";

import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { Dashboard, Analytics, ModelTraining, Monitor, Settings as SettingsIcon, Logout, MenuBook, Info } from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { APP_CONFIG } from "@config/app.config";

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  mobileOpen: boolean;
}

const navItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  { text: "Models", icon: <ModelTraining />, path: "/models" },
  { text: "Monitoring", icon: <Monitor />, path: "/monitoring" },
  { text: "Logs", icon: <MenuBook />, path: "/logs" },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  { text: "Analytics", icon: <Analytics />, path: "/analytics" },
];

export function Sidebar({ open, onClose, mobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const drawerVariants = {
    open: { width: drawerWidth },
    closed: { width: 0 },
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo and title */}
      <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h6" fontWeight="bold" color="primary">
            {APP_CONFIG.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AI Model Management
          </Typography>
        </motion.div>
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <List>
          {navItems.map((item, index) => {
            const isActive = pathname === item.path;

            return (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.path}
                    selected={isActive}
                    sx={{
                      pl: 3,
                      borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : "none",
                      "&.Mui-selected": {
                        backgroundColor: theme.palette.action.selected,
                      },
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                    onClick={isMobile ? onClose : undefined}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: "40px",
                        color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? "medium" : "regular",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box p={2} borderTop={`1px solid ${theme.palette.divider}`}>
        <List>
          <ListItem disablePadding>
            <ListItemButton component={Link} href="/about">
              <ListItemIcon sx={{ minWidth: "40px" }}>
                <Info />
              </ListItemIcon>
              <ListItemText primary="About" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon sx={{ minWidth: "40px" }}>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            v{APP_CONFIG.version}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <motion.div
      initial={false}
      animate={open ? "open" : "closed"}
      variants={drawerVariants}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: theme.palette.background.paper,
            borderRight: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </motion.div>
  );
}