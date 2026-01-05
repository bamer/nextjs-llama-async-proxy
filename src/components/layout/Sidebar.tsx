'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Monitor, Bot, FileText, Settings, Home, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, IconButton, Typography, Chip } from '@mui/material';
import { useTheme as useMuiTheme } from '@/contexts/ThemeContext';
import { APP_CONFIG } from '@/config/app.config';
import { useSidebar, DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from './SidebarProvider';
import { NavSection } from './NavSection';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string | number;
  badgeColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success';
  section: 'overview' | 'management' | 'system';
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard', section: 'overview' },
  { id: 'monitoring', label: 'Monitoring', icon: Monitor, path: '/monitoring', badge: 'new', badgeColor: 'success', section: 'overview' },
  { id: 'models', label: 'Models', icon: Bot, path: '/models', section: 'management' },
  { id: 'logs', label: 'Logs', icon: FileText, path: '/logs', section: 'management' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', section: 'system' },
];

interface SidebarProps {
  isMobile: boolean;
}

export function Sidebar({ isMobile }: SidebarProps) {
  const theme = useMuiTheme();
  const pathname = usePathname();
  const { isOpen, isCollapsed, closeSidebar, toggleCollapse } = useSidebar();

  const isActive = (path: string) => pathname === path;
  const drawerWidth = isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  const getColor = (active: boolean, type: 'bg' | 'border' | 'text' | 'hover' | 'active') => {
    const isDark = theme.isDark;
    const colors: Record<string, string> = {
      bg: isDark ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      text: active ? (isDark ? '#f1f5f9' : '#1e293b') : (isDark ? '#cbd5e1' : '#64748b'),
      hover: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(13, 158, 248, 0.05)',
      active: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)',
    };
    return colors[type] || colors.bg;
  };

  const renderMenuItem = (item: MenuItem) => {
    const IconComponent = item.icon;
    const active = isActive(item.path);

    if (isCollapsed) {
      return (
        <ListItem key={item.id} disablePadding sx={{ px: 1, mb: 1 }}>
          <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }} onClick={closeSidebar}>
            <ListItemButton
              selected={active}
              data-testid={`menu-item-${item.id}`}
              aria-label={item.label}
              sx={{
                borderRadius: '8px',
                justifyContent: 'center',
                background: getColor(active, 'active'),
                '&:hover': { background: getColor(false, 'hover') },
                transition: 'all 0.2s ease',
                minHeight: 48,
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto', color: getColor(active, 'text') }}>
                <IconComponent className="h-5 w-5" />
              </ListItemIcon>
            </ListItemButton>
          </Link>
        </ListItem>
      );
    }

    return (
      <ListItem key={item.id} disablePadding sx={{ px: 2 }}>
        <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }} onClick={closeSidebar}>
          <ListItemButton
            selected={active}
            data-testid={`menu-item-${item.id}`}
            aria-label={item.label}
            sx={{
              borderRadius: '8px',
              mb: 1,
              background: getColor(active, 'active'),
              '&:hover': { background: getColor(false, 'hover') },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px', color: getColor(active, 'text') }}>
              <IconComponent className="h-5 w-5" />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              data-testid={`menu-label-${item.id}`}
              primaryTypographyProps={{
                fontWeight: active ? 'medium' : 'normal',
                color: getColor(active, 'text'),
                fontSize: '0.95rem',
              }}
            />
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                color={item.badgeColor || 'error'}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              />
            )}
          </ListItemButton>
        </Link>
      </ListItem>
    );
  };

  const renderNavSections = () => {
    const sections = {
      overview: menuItems.filter(item => item.section === 'overview'),
      management: menuItems.filter(item => item.section === 'management'),
      system: menuItems.filter(item => item.section === 'system'),
    };

    return (
      <>
        <NavSection title="Overview" defaultExpanded={true}>
          {sections.overview.map(renderMenuItem)}
        </NavSection>
        <NavSection title="Management" defaultExpanded={true}>
          {sections.management.map(renderMenuItem)}
        </NavSection>
        <NavSection title="System" defaultExpanded={false}>
          {sections.system.map(renderMenuItem)}
        </NavSection>
      </>
    );
  };

  const getDrawerPaperStyles = (): object => ({
    width: isMobile ? '100%' : drawerWidth,
    background: getColor(false, 'bg'),
    borderRight: `1px solid ${getColor(false, 'border')}`,
    boxShadow: theme.isDark ? '2px 0 10px rgba(0, 0, 0, 0.3)' : '2px 0 10px rgba(0, 0, 0, 0.05)',
    boxSizing: 'border-box' as const,
    transition: 'width 0.2s ease-in-out',
  });

  const renderDrawerContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${getColor(false, 'border')}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {!isCollapsed && (
            <Typography variant="h6" fontWeight="bold" sx={{ color: getColor(true, 'text') }}>
              Llama Runner
            </Typography>
          )}
          {!isMobile && (
            <IconButton
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              sx={{ color: getColor(false, 'text'), ml: 'auto' }}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </IconButton>
          )}
          {isMobile && (
            <IconButton onClick={closeSidebar} aria-label="Close sidebar" sx={{ color: getColor(false, 'text') }}>
              <X className="h-5 w-5" />
            </IconButton>
          )}
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        <List>{isCollapsed ? menuItems.map(renderMenuItem) : renderNavSections()}</List>
      </Box>
      {!isCollapsed && (
        <Box sx={{ p: 3, borderTop: `1px solid ${getColor(false, 'border')}` }}>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            © {new Date().getFullYear()} Llama Runner Pro
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            v{APP_CONFIG.version}
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <Box
            data-testid="sidebar-overlay"
            sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0, 0, 0, 0.5)', zIndex: (t) => t.zIndex.drawer - 1 }}
            onClick={closeSidebar}
          />
        )}
        <Drawer
          variant="temporary"
          open={isOpen}
          onClose={closeSidebar}
          data-testid="sidebar-drawer"
          sx={{
            '& .MuiDrawer-paper': getDrawerPaperStyles(),
            zIndex: (t) => t.zIndex.drawer,
          }}
          ModalProps={{ keepMounted: true }}
        >
          {renderDrawerContent()}
        </Drawer>
      </>
    );
  }

  return (
    <Drawer variant="permanent" data-testid="sidebar-drawer" sx={{ '& .MuiDrawer-paper': getDrawerPaperStyles() }}>
      {renderDrawerContent()}
    </Drawer>
  );
}
