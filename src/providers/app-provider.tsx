"use client";

import React, { ReactNode } from "react";
import { ThemeProvider } from "@contexts/theme-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { MotionLazyContainer } from "@/components/animate/motion-lazy-container";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { PerformanceMonitor } from "@/components/performance/performance-monitor";

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10000, // 10 seconds for real-time data
    },
  },
});

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <WebSocketProvider>
            <SnackbarProvider
              maxSnack={5}
              autoHideDuration={5000}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              preventDuplicate
            >
              <CssBaseline />
              <PerformanceMonitor />
              <MotionLazyContainer>{children}</MotionLazyContainer>
            </SnackbarProvider>
          </WebSocketProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </LocalizationProvider>
  );
}