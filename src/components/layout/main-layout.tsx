"use client";

import { useState, useEffect } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Header } from "../layout/header";
import { Sidebar } from "../layout/sidebar";
import { useTheme as useAppTheme } from "../contexts/theme-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* Header */}
      <Header onMenuToggle={toggleSidebar} />

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mobileOpen={isMobile && sidebarOpen}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: "64px",
          ml: sidebarOpen && !isMobile ? "240px" : 0,
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          width: sidebarOpen && !isMobile ? `calc(100% - 240px)` : "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}