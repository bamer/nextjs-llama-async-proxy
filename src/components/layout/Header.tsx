'use client';

import { useSidebar } from './SidebarProvider';
import { Menu } from 'lucide-react';

const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground shadow-md z-20 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 p-2 rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Llama Runner Async Proxy</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Theme toggle removed - using system preference */}
      </div>
    </header>
  );
};

export default Header;