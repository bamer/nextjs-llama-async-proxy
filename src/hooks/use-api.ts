import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api-service";
import { useSnackbar } from "notistack";

export function useApi() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Models queries
  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: () => apiService.getModels(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Metrics queries
  const metricsQuery = useQuery({
    queryKey: ["metrics"],
    queryFn: () => apiService.getMetrics(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Logs queries
  const logsQuery = useQuery({
    queryKey: ["logs"],
    queryFn: () => apiService.getLogs({ limit: 50 }),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Config queries
  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: () => apiService.getConfig(),
    refetchInterval: false, // Config doesn't change often
  });

  // Mutations
  const generateTextMutation = useMutation({
    mutationFn: (data: { prompt: string; model?: string; max_tokens?: number }) =>
      apiService.generateText(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Generation failed: ${error.message}`, { variant: "error" });
    },
  });

  const chatMutation = useMutation({
    mutationFn: (data: { messages: any[]; model?: string; max_tokens?: number }) =>
      apiService.chat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Chat failed: ${error.message}`, { variant: "error" });
    },
  });

  const loadModelMutation = useMutation({
    mutationFn: (data: { id: string; config?: any }) =>
      apiService.loadModel(data.id, data.config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      enqueueSnackbar("Model loaded successfully", { variant: "success" });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to load model: ${error.message}`, { variant: "error" });
    },
  });

  const unloadModelMutation = useMutation({
    mutationFn: (id: string) => apiService.unloadModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      enqueueSnackbar("Model unloaded successfully", { variant: "success" });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to unload model: ${error.message}`, { variant: "error" });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiService.updateModel(id, updates),
    onSuccess: () => {
      enqueueSnackbar("Model updated successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to update model: ${error.message}`, { variant: "error" });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteModel(id),
    onSuccess: () => {
      enqueueSnackbar("Model deleted successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to delete model: ${error.message}`, { variant: "error" });
    },
  });

  const startModelMutation = useMutation({
    mutationFn: (id: string) => apiService.startModel(id),
    onSuccess: () => {
      enqueueSnackbar("Model started successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to start model: ${error.message}`, { variant: "error" });
    },
  });

  const stopModelMutation = useMutation({
    mutationFn: (id: string) => apiService.stopModel(id),
    onSuccess: () => {
      enqueueSnackbar("Model stopped successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to stop model: ${error.message}`, { variant: "error" });
    },
  });

  const metricsQuery2 = useQuery({
    queryKey: ["metrics"],
    queryFn: () => apiService.getMetrics(),
    refetchInterval: 10000, // 10 seconds
  });

  const metricsHistoryQuery = useQuery({
    queryKey: ["metrics", "history"],
    queryFn: () => apiService.getMetricsHistory({ limit: 100 }),
  });

  const logsQuery2 = useQuery({
    queryKey: ["logs"],
    queryFn: () => apiService.getLogs({ limit: 50 }),
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => apiService.clearLogs(),
    onSuccess: () => {
      enqueueSnackbar("Logs cleared successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to clear logs: ${error.message}`, { variant: "error" });
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiService.getSettings(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiService.updateSettings(settings),
    onSuccess: () => {
      enqueueSnackbar("Settings updated successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to update settings: ${error.message}`, { variant: "error" });
    },
  });

  const systemInfoQuery = useQuery({
    queryKey: ["system", "info"],
    queryFn: () => apiService.getSystemInfo(),
  });

  const restartSystemMutation = useMutation({
    mutationFn: () => apiService.restartSystem(),
    onSuccess: () => {
      enqueueSnackbar("System restart initiated", { variant: "info" });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to restart system: ${error.message}`, { variant: "error" });
    },
  });

  const shutdownSystemMutation = useMutation({
    mutationFn: () => apiService.shutdownSystem(),
    onSuccess: () => {
      enqueueSnackbar("System shutdown initiated", { variant: "warning" });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Failed to shutdown system: ${error.message}`, { variant: "error" });
    },
  });

  const healthCheckQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => apiService.healthCheck(),
    refetchInterval: 30000, // 30 seconds
  });

  return {
    // Models queries and mutations
    models: modelsQuery.data,
    modelsLoading: modelsQuery.isLoading,
    modelsError: modelsQuery.error,
    refetchModels: modelsQuery.refetch,

    updateModel: updateModelMutation.mutate,
    updateModelAsync: updateModelMutation.mutateAsync,
    isUpdatingModel: updateModelMutation.isPending,

    deleteModel: deleteModelMutation.mutate,
    deleteModelAsync: deleteModelMutation.mutateAsync,
    isDeletingModel: deleteModelMutation.isPending,

    startModel: startModelMutation.mutate,
    startModelAsync: startModelMutation.mutateAsync,
    isStartingModel: startModelMutation.isPending,

    stopModel: stopModelMutation.mutate,
    stopModelAsync: stopModelMutation.mutateAsync,
    isStoppingModel: stopModelMutation.isPending,

    // Metrics
    metrics: metricsQuery.data,
    metricsLoading: metricsQuery.isLoading,
    metricsError: metricsQuery.error,
    refetchMetrics: metricsQuery.refetch,

    // Logs
    logs: logsQuery.data,
    logsLoading: logsQuery.isLoading,
    logsError: logsQuery.error,
    refetchLogs: logsQuery.refetch,

    clearLogs: clearLogsMutation.mutate,
    clearLogsAsync: clearLogsMutation.mutateAsync,
    isClearingLogs: clearLogsMutation.isPending,

    // Config
    config: configQuery.data,
    configLoading: configQuery.isLoading,
    configError: configQuery.error,
    refetchConfig: configQuery.refetch,

    // Settings
    settings: settingsQuery.data,
    settingsLoading: settingsQuery.isLoading,
    settingsError: settingsQuery.error,
    refetchSettings: settingsQuery.refetch,

    updateSettings: updateSettingsMutation.mutate,
    updateSettingsAsync: updateSettingsMutation.mutateAsync,
    isUpdatingSettings: updateSettingsMutation.isPending,

    // System
    systemInfo: systemInfoQuery.data,
    systemInfoLoading: systemInfoQuery.isLoading,
    systemInfoError: systemInfoQuery.error,

    restartSystem: restartSystemMutation.mutate,
    restartSystemAsync: restartSystemMutation.mutateAsync,
    isRestartingSystem: restartSystemMutation.isPending,

    shutdownSystem: shutdownSystemMutation.mutate,
    shutdownSystemAsync: shutdownSystemMutation.mutateAsync,
    isShuttingdownSystem: shutdownSystemMutation.isPending,

    // Health
    health: healthCheckQuery.data,
    healthLoading: healthCheckQuery.isLoading,
    healthError: healthCheckQuery.error,
    refetchHealth: healthCheckQuery.refetch,

    // Original mutations
    generateText: generateTextMutation.mutate,
    generateTextAsync: generateTextMutation.mutateAsync,
    isGenerating: generateTextMutation.isPending,

    chat: chatMutation.mutate,
    chatAsync: chatMutation.mutateAsync,
    isChatting: chatMutation.isPending,

    loadModel: loadModelMutation.mutate,
    loadModelAsync: loadModelMutation.mutateAsync,
    isLoadingModel: loadModelMutation.isPending,

    unloadModel: unloadModelMutation.mutate,
    unloadModelAsync: unloadModelMutation.mutateAsync,
    isUnloadingModel: unloadModelMutation.isPending,
  };
}
