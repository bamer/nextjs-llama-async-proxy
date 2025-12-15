'use client';

import { useSidebar } from './SidebarProvider';
import { Menu } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-background/90 via-background/95 to-background/90 dark:from-background/90 dark:via-background/95 dark:to-background/90 backdrop-blur-md border-b border-border dark:border-border shadow-lg z-20 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background shadow-sm"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Llama Runner Async Proxy</h1>
      </div>
       <div className="flex items-center gap-4">
         <ThemeToggle />
       </div>
    </header>
  );
};

export default Header;