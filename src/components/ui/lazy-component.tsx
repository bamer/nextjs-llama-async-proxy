"use client";

import { lazy, Suspense, ComponentType } from "react";
import { Loading } from "@components/ui/loading";

interface LazyComponentProps {
  importFn: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: any;
}

export function LazyComponent({ importFn, fallback, props }: LazyComponentProps) {
  const Component = lazy(importFn);

  return (
    <Suspense fallback={fallback || <Loading />}>
      <Component {...props} />
    </Suspense>
  );
}