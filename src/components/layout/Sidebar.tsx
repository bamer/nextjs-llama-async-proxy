'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarProvider';
import {
  Monitor,
  Bot,
  FileText,
  Settings,
  X,
  Home
} from 'lucide-react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Typography
} from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';
import { motion as m } from 'framer-motion';
import { APP_CONFIG } from '@/config/app.config';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'monitoring', label: 'Monitoring', icon: Monitor, path: '/monitoring' },
  { id: 'models', label: 'Models', icon: Bot, path: '/models' },
  { id: 'logs', label: 'Logs', icon: FileText, path: '/logs' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const pathname = usePathname();
  const { isDark } = useTheme();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bg: 'rgba(0, 0, 0, 0.5)',
            zIndex: (theme) => theme.zIndex.drawer - 1,
            lg: { display: 'none' }
          }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        open={isOpen}
        onClose={closeSidebar}
        sx={{
          width: 256,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 256,
            boxSizing: 'border-box',
            background: isDark ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            boxShadow: isDark ? '2px 0 10px rgba(0, 0, 0, 0.3)' : '2px 0 10px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.3s ease',
          },
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>
                Llama Runner
              </Typography>
              <IconButton onClick={closeSidebar} className="lg:hidden" sx={{ color: isDark ? '#cbd5e1' : '#64748b' }}>
                <X className="h-5 w-5" />
              </IconButton>
            </Box>
          </Box>

          {/* Menu items */}
          <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
            <List>
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.path);

                return (
       
                    <ListItem key={item.id} disablePadding sx={{ px: 2 }}>
                      <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }} onClick={closeSidebar}>

                        <ListItemButton
                          selected={active}
                          sx={{
                            borderRadius: '8px',
                            mb: 1,
                            background: active ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)') : 'transparent',
                            '&:hover': {
                              background: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(13, 158, 248, 0.05)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: '40px', color: active ? (isDark ? '#3b82f6' : '#0d9ef8') : (isDark ? '#94a3b8' : '#64748b') }}>
                            <IconComponent className="h-5 w-5" />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontWeight: active ? 'medium' : 'normal',
                              color: active ? (isDark ? '#f1f5f9' : '#1e293b') : (isDark ? '#cbd5e1' : '#64748b'),
                              fontSize: '0.95rem'
                            }}
                          />
                        </ListItemButton>

                      </Link>

                    </ListItem>
         
                );
              })}
            </List>
          </Box>

          {/* Footer */}
          <Box sx={{ p: 3, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}` }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
              © {new Date().getFullYear()} Llama Runner Pro
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
              v{APP_CONFIG.version}
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
