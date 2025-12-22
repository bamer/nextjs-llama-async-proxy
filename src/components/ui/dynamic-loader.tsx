"use client";

import { Suspense } from "react";
import { Loading } from "@components/ui/loading";

interface DynamicLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingMessage?: string;
}

export function DynamicLoader({ children, fallback, loadingMessage }: DynamicLoaderProps) {
  return (
    <Suspense fallback={fallback || <Loading message={loadingMessage || "Loading..."} />}>
      {children}
    </Suspense>
  );
}