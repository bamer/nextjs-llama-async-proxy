'use client';

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isDark } = useTheme();

  return (
    <SidebarProvider>
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
      }}>
        <Header />
        <Box sx={{ display: 'flex', flex: 1, pt: '64px' }}>
          <Sidebar />
          <Box sx={{ 
            flex: 1,
            ml: { xs: 0, lg: '256px' },
            transition: 'all 0.3s ease',
            p: { xs: 2, sm: 3, md: 4 }
          }}>
            {children}
          </Box>
        </Box>
      </Box>
    </SidebarProvider>
  );
}
