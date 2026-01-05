'use client';

import React from 'react';
import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider, useSidebar, DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from '@/components/layout/SidebarProvider';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <>
      <CssBaseline />
      <Box
        data-testid="main-layout"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'background.default',
        }}
      >
        <Header />
        <Box sx={{ display: 'flex', flex: 1, pt: '64px' }}>
          <Sidebar isMobile={isMobile} />
          <Box
            component="main"
            sx={{
              flex: 1,
              width: { md: `calc(100% - ${sidebarWidth}px)` },
              ml: { md: 0 },
              p: { xs: 2, sm: 3, md: 4 },
              transition: 'all 0.3s ease',
              overflow: 'auto',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Breadcrumbs />
            </Box>
            {children}
          </Box>
        </Box>
      </Box>
    </>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
