"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardActions } from "@/hooks/useDashboardActions";

interface DashboardContextValue {
  connectionState: string;
  models: unknown[];
  metrics: unknown | null;
  loading: boolean;
  error: string | null;
  serverRunning: boolean;
  serverLoading: boolean;
  onRefresh: () => Promise<void>;
  onRestart: () => Promise<void>;
  onStart: () => Promise<void>;
  onDownloadLogs: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const dashboardData = useDashboardData();
  const dashboardActions = useDashboardActions();
  const [serverRunning, setServerRunning] = useState(false);
  const [serverLoading, setServerLoading] = useState(false);

  const handleRestart = async () => {
    setServerLoading(true);
    try {
      await dashboardActions.handleRestart();
      setTimeout(() => {
        setServerRunning(true);
        setServerLoading(false);
      }, 2000);
    } catch (error) {
      setServerLoading(false);
      throw error;
    }
  };

  const handleStart = async () => {
    setServerLoading(true);
    try {
      await dashboardActions.handleStart();
      setTimeout(() => {
        setServerRunning(true);
        setServerLoading(false);
      }, 2000);
    } catch (error) {
      setServerLoading(false);
      throw error;
    }
  };

  const contextValue: DashboardContextValue = {
    connectionState: dashboardData.connectionState,
    models: dashboardData.models,
    metrics: dashboardData.metrics,
    loading: dashboardData.loading,
    error: dashboardData.error,
    serverRunning,
    serverLoading,
    onRefresh: dashboardActions.handleRefresh,
    onRestart: handleRestart,
    onStart: handleStart,
    onDownloadLogs: dashboardActions.handleDownloadLogs,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
