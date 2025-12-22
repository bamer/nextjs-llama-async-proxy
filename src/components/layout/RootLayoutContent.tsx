'use client';

import React from 'react';
import { SidebarProvider } from './SidebarProvider';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function RootLayoutContent({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex flex-1 pt-16">
          <Sidebar />
          <main className="flex-1 lg:ml-64 transition-all duration-300">
            <div className="p-6 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
