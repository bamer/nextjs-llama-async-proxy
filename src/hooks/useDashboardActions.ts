"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api-service";
import { apiClient } from "@/utils/api-client";

interface UseDashboardActionsReturn {
  handleRestart: () => Promise<void>;
  handleStart: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleDownloadLogs: () => void;
}

export function useDashboardActions(): UseDashboardActionsReturn {
  const queryClient = useQueryClient();

  const handleRestart = useCallback(async () => {
    try {
      await apiClient.post("/api/llama-server/rescan");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to restart llama server";
      console.error("[useDashboardActions] Restart error:", error);
      throw new Error(message);
    }
  }, [queryClient]);

  const handleStart = useCallback(async () => {
    try {
      await apiService.getModels();
      queryClient.invalidateQueries({ queryKey: ["models"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start llama server";
      console.error("[useDashboardActions] Start error:", error);
      throw new Error(message);
    }
  }, [queryClient]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([apiService.getModels(), apiService.getMetrics()]);
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh dashboard data";
      console.error("[useDashboardActions] Refresh error:", error);
      throw new Error(message);
    }
  }, [queryClient]);

  const handleDownloadLogs = useCallback(() => {
    try {
      const response = apiClient.get("/api/logs");
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `server-logs-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download logs";
      console.error("[useDashboardActions] Download logs error:", error);
      throw new Error(message);
    }
  }, []);

  return {
    handleRestart,
    handleStart,
    handleRefresh,
    handleDownloadLogs,
  };
}
