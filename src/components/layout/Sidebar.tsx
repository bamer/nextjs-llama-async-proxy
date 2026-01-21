'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSidebar } from './SidebarProvider';
import { BarChart3, Monitor, Bot, FileText, Settings } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const Sidebar = () => {
  const { isOpen } = useSidebar();
  const pathname = usePathname();
  const { theme } = useTheme();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor, path: '/monitoring' },
    { id: 'models', label: 'Models', icon: Bot, path: '/models' },
    { id: 'logs', label: 'Logs', icon: FileText, path: '/logs' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isActive = (path: string) => pathname === path;

  const getActiveClasses = () => {
    if (theme === 'dark') {
      return 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg';
    }
    return 'bg-primary-800 text-primary-50 shadow-lg';
  };

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-background/90 dark:bg-background/90 backdrop-blur-md border-r border-border dark:border-border shadow-xl z-10 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      suppressHydrationWarning
    >
      <nav className="p-6 flex flex-col gap-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.id}
              href={item.path}
                className={`flex justify-start items-center p-4 rounded-xl hover:bg-primary-100 hover:text-primary-900 dark:hover:bg-primary-900 dark:hover:text-primary-100 transition-all duration-200 shadow-sm hover:shadow-md ${isActive(item.path) ? getActiveClasses() : 'text-foreground dark:text-foreground'}`}
            >
              <IconComponent className="mr-4 h-5 w-5 transition-all duration-200" />
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;