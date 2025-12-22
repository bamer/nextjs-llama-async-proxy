import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api-service";
import { useSnackbar } from "notistack";
import { useStore } from "@/lib/store";

export function useApi() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const status = useStore((state) => state.status);

  // Models queries
  const useModelsQuery = () => {
    return useQuery({
      queryKey: ["models"],
      queryFn: () => apiService.getModels(),
      onSuccess: () => {
        enqueueSnackbar("Models loaded successfully", { variant: "success" });
      },
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
        useStore.getState().setError(error.message);
      },
    });
  };

  const useModelQuery = (id: string) => {
    return useQuery({
      queryKey: ["models", id],
      queryFn: () => apiService.getModel(id),
      enabled: !!id,
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
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
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
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
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
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
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
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
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
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
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  // Metrics queries
  const useMetricsQuery = () => {
    return useQuery({
      queryKey: ["metrics"],
      queryFn: () => apiService.getMetrics(),
      refetchInterval: 10000, // 10 seconds
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  const useMetricsHistoryQuery = (params: { limit?: number; hours?: number }) => {
    return useQuery({
      queryKey: ["metrics", "history", params],
      queryFn: () => apiService.getMetricsHistory(params),
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  // Logs queries
  const useLogsQuery = (params: { limit?: number; level?: string }) => {
    return useQuery({
      queryKey: ["logs", params],
      queryFn: () => apiService.getLogs(params),
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  const useClearLogsMutation = () => {
    return useMutation({
      mutationFn: () => apiService.clearLogs(),
      onSuccess: () => {
        enqueueSnackbar("Logs cleared successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["logs"] });
      },
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  // Settings queries
  const useSettingsQuery = () => {
    return useQuery({
      queryKey: ["settings"],
      queryFn: () => apiService.getSettings(),
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  const useUpdateSettingsMutation = () => {
    return useMutation({
      mutationFn: (settings: any) => apiService.updateSettings(settings),
      onSuccess: () => {
        enqueueSnackbar("Settings updated successfully", { variant: "success" });
        queryClient.invalidateQueries({ queryKey: ["settings"] });
      },
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  // System queries
  const useSystemInfoQuery = () => {
    return useQuery({
      queryKey: ["system", "info"],
      queryFn: () => apiService.getSystemInfo(),
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  const useRestartSystemMutation = () => {
    return useMutation({
      mutationFn: () => apiService.restartSystem(),
      onSuccess: () => {
        enqueueSnackbar("System restart initiated", { variant: "info" });
      },
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  const useShutdownSystemMutation = () => {
    return useMutation({
      mutationFn: () => apiService.shutdownSystem(),
      onSuccess: () => {
        enqueueSnackbar("System shutdown initiated", { variant: "info" });
      },
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
    });
  };

  // Health check
  const useHealthCheckQuery = () => {
    return useQuery({
      queryKey: ["health"],
      queryFn: () => apiService.healthCheck(),
      refetchInterval: 30000, // 30 seconds
      onError: (error: Error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      },
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