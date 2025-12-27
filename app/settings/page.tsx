"use client";

import { MainLayout } from "@/components/layout/main-layout";
import ModernConfiguration from "@/components/configuration/ModernConfiguration";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SettingsFallback } from "@/components/ui/error-fallbacks";

export default function SettingsPage() {
  return (
    <MainLayout>
      <ErrorBoundary fallback={<SettingsFallback />}>
        <ModernConfiguration />
      </ErrorBoundary>
    </MainLayout>
  );
}
