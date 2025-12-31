import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api-service';

export function useApi(): any {
  const queryClient = useQueryClient();

  // Models queries
  const modelsQuery = useQuery({
    queryKey: ['models'],
    queryFn: () => apiService.getModels(),
    refetchInterval: false,
  });

  // Metrics queries
  const metricsQuery = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiService.getMetrics(),
    refetchInterval: false,
  });

  // Logs queries
  const logsQuery = useQuery({
    queryKey: ['logs'],
    queryFn: () => apiService.getLogs({ limit: 50 }),
    refetchInterval: false,
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
