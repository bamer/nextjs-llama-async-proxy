'use client';

import React from 'react';
import { SidebarProvider } from './SidebarProvider';
import { MainLayout } from './main-layout';
import { OnboardingWrapper } from '@/components/onboarding/OnboardingWrapper';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <OnboardingWrapper>
        <MainLayout>{children}</MainLayout>
      </OnboardingWrapper>
    </SidebarProvider>
  );
};

export default Layout;
