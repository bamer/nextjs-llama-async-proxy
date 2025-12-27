"use client";

import { MainLayout } from "@/components/layout/main-layout";
import ModernDashboard from "@/components/dashboard/ModernDashboard";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DashboardFallback } from "@/components/ui/error-fallbacks";

export default function DashboardPage() {
  return (
    <MainLayout>
      <ErrorBoundary fallback={<DashboardFallback />}>
        <ModernDashboard />
      </ErrorBoundary>
    </MainLayout>
  );
}
