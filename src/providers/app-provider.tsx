"use client";

import { ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { MotionLazyContainer } from "@/components/animate/motion-lazy-container";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { WebSocketProvider } from "@/providers/websocket-provider";

function ToastProvider({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();

  return (
    <>
      <Toaster position="top-right" theme={isDark ? "dark" : "light"} richColors closeButton />
      {children}
    </>
  );
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Lazy initialize QueryClient only on client side to prevent SSR issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
            refetchInterval: 10000,
            refetchOnMount: true,
          },
        },
      })
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <WebSocketProvider>
            <MotionLazyContainer>
              <ErrorBoundary>
                <ToastProvider>{children}</ToastProvider>
              </ErrorBoundary>
            </MotionLazyContainer>
          </WebSocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </LocalizationProvider>
  );
}
