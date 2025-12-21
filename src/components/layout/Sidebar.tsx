'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarProvider';
import {
  BarChart3,
  Monitor,
  Bot,
  FileText,
  Settings,
  X,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { id: 'monitoring', label: 'Monitoring', icon: Monitor, path: '/monitoring' },
  { id: 'models', label: 'Models', icon: Bot, path: '/models' },
  { id: 'logs', label: 'Logs', icon: FileText, path: '/logs' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-40 transition-transform duration-300 lg:translate-x-0 lg:relative lg:h-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 flex flex-col gap-2 h-full overflow-auto">
          {/* Close button for mobile */}
          <button
            onClick={closeSidebar}
            className="self-end p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden mb-2"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Menu items */}
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <IconComponent className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
