'use client';

import React from 'react';
import { SidebarProvider } from './SidebarProvider';
import { MainLayout } from './main-layout';

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MainLayout>{children}</MainLayout>
    </SidebarProvider>
  );
}
