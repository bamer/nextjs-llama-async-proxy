import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api-service';

export function useApi() {
  const queryClient = useQueryClient();

  // Models queries
  const modelsQuery = useQuery({
    queryKey: ['models'],
    queryFn: () => apiService.getModels(),
    refetchInterval: 30000,
  });

  // Metrics queries
  const metricsQuery = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiService.getMetrics(),
    refetchInterval: 10000,
  });

  // Logs queries
  const logsQuery = useQuery({
    queryKey: ['logs'],
    queryFn: () => apiService.getLogs({ limit: 50 }),
    refetchInterval: 15000,
  });

  // Config queries
  const configQuery = useQuery({
    queryKey: ['config'],
    queryFn: () => apiService.getConfig(),
  });

  return {
    models: modelsQuery,
    metrics: metricsQuery,
    logs: logsQuery,
    config: configQuery,
    queryClient,
  };
}
