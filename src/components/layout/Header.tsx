'use client';

import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSidebar } from './SidebarProvider';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';
import { Rocket } from '@mui/icons-material';

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { isDark } = useTheme();

  return (
    <AppBar 
      position="fixed"
      sx={{
        height: '64px',
        background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        boxShadow: 'none',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <IconButton
            onClick={toggleSidebar}
            className="lg:hidden"
            aria-label="Toggle sidebar"
            sx={{ color: isDark ? '#cbd5e1' : '#64748b' }}
          >
            <Menu className="h-5 w-5" />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Rocket sx={{ color: isDark ? '#3b82f6' : '#0d9ef8', fontSize: '1.5rem' }} />
            <Typography 
              variant="h6"
              fontWeight="bold"
              sx={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
            >
              Llama Runner Pro
            </Typography>
          </Box>
        </Box>
        <ThemeToggle />
      </Toolbar>
    </AppBar>
  );
}
