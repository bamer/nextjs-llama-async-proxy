import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api-service";
import { useSnackbar } from "notistack";
// import { useStore } from "@/lib/store";

export function useApi() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  // const status = useStore((state) => state.status);

  // Models queries
  const useModelsQuery = () => {
    return useQuery({
      queryKey: ["models"],
      queryFn: () => apiService.getModels(),
    });
  };

  const useModelQuery = (id: string) => {
    return useQuery({
      queryKey: ["models", id],
      queryFn: () => apiService.getModel(id),
      enabled: !!id,
    });
  };

  // Models mutations
  const useCreateModelMutation = () => {
    return useMutation({
      mutationFn: (model: any) => apiService.createModel(model),
      onSuccess: () => {
        enqueueSnackbar("Model created successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["models"] });
      },
    });
  };

  const useUpdateModelMutation = () => {
    return useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: any }) => 
        apiService.updateModel(id, updates),
      onSuccess: () => {
        enqueueSnackbar("Model updated successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["models"] });
      },
    });
  };

  const useDeleteModelMutation = () => {
    return useMutation({
      mutationFn: (id: string) => apiService.deleteModel(id),
      onSuccess: () => {
        enqueueSnackbar("Model deleted successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["models"] });
      },
    });
  };

  const useStartModelMutation = () => {
    return useMutation({
      mutationFn: (id: string) => apiService.startModel(id),
      onSuccess: () => {
        enqueueSnackbar("Model started successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["models"] });
      },
    });
  };

  const useStopModelMutation = () => {
    return useMutation({
      mutationFn: (id: string) => apiService.stopModel(id),
      onSuccess: () => {
        enqueueSnackbar("Model stopped successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["models"] });
      },
    });
  };

  // Metrics queries
  const useMetricsQuery = () => {
    return useQuery({
      queryKey: ["metrics"],
      queryFn: () => apiService.getMetrics(),
      refetchInterval: 10000, // 10 seconds
    });
  };

  const useMetricsHistoryQuery = (params: { limit?: number; hours?: number }) => {
    return useQuery({
      queryKey: ["metrics", "history", params],
      queryFn: () => apiService.getMetricsHistory(params),
    });
  };

  // Logs queries
  const useLogsQuery = (params: { limit?: number; level?: string }) => {
    return useQuery({
      queryKey: ["logs", params],
      queryFn: () => apiService.getLogs(params),
    });
  };

  const useClearLogsMutation = () => {
    return useMutation({
      mutationFn: () => apiService.clearLogs(),
      onSuccess: () => {
        enqueueSnackbar("Logs cleared successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["logs"] });
      },
    });
  };

  // Settings queries
  const useSettingsQuery = () => {
    return useQuery({
      queryKey: ["settings"],
      queryFn: () => apiService.getSettings(),
    });
  };

  const useUpdateSettingsMutation = () => {
    return useMutation({
      mutationFn: (settings: any) => apiService.updateSettings(settings),
      onSuccess: () => {
        enqueueSnackbar("Settings updated successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["settings"] });
      },
    });
  };

  // System queries
  const useSystemInfoQuery = () => {
    return useQuery({
      queryKey: ["system", "info"],
      queryFn: () => apiService.getSystemInfo(),
    });
  };

  const useRestartSystemMutation = () => {
    return useMutation({
      mutationFn: () => apiService.restartSystem(),
      onSuccess: () => {
        enqueueSnackbar("System restart initiated", { variant: "info" });
      },
    });
  };

  const useShutdownSystemMutation = () => {
    return useMutation({
      mutationFn: () => apiService.shutdownSystem(),
      onSuccess: () => {
        enqueueSnackbar("System shutdown initiated", { variant: "info" });
      },
    });
  };

  // Health check
  const useHealthCheckQuery = () => {
    return useQuery({
      queryKey: ["health"],
      queryFn: () => apiService.healthCheck(),
      refetchInterval: 30000, // 30 seconds
    });
  };

  return {
    // Models
    useModelsQuery,
    useModelQuery,
    useCreateModelMutation,
    useUpdateModelMutation,
    useDeleteModelMutation,
    useStartModelMutation,
    useStopModelMutation,

    // Metrics
    useMetricsQuery,
    useMetricsHistoryQuery,

    // Logs
    useLogsQuery,
    useClearLogsMutation,

    // Settings
    useSettingsQuery,
    useUpdateSettingsMutation,

    // System
    useSystemInfoQuery,
    useRestartSystemMutation,
    useShutdownSystemMutation,

    // Health
    useHealthCheckQuery,
  };
}

export const useApiService = useApi();