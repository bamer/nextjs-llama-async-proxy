'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor, path: '/monitoring' },
    { id: 'models', label: 'Models', icon: Bot, path: '/models' },
    { id: 'logs', label: 'Logs', icon: FileText, path: '/logs' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 shadow-xl z-10 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <nav className="p-6 flex flex-col gap-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex justify-start items-center p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md ${isActive(item.path) ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'}`}
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