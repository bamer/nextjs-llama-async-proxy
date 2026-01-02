/**
 * API error handling test scenarios
 * Tests for null/undefined inputs and various error states
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../../use-api';
import * as apiServiceModule from '@/services/api-service';

export function runApiErrorScenarios(
  mockedApiService: jest.Mocked<typeof apiServiceModule.apiService>,
  createWrapper: () => ({ children }: any) => React.JSX.Element,
) {
  describe('Null/Undefined Handling', () => {
    it('should handle null response from getModels', async () => {
      mockedApiService.getModels.mockResolvedValue(null as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.data).toBeNull();
        expect(result.current.models.isSuccess).toBe(true);
      });
    });

    it('should handle undefined response from getMetrics', async () => {
      mockedApiService.getMetrics.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.metrics.data).toBeUndefined();
        expect(result.current.metrics.isSuccess).toBe(true);
      });
    });

    it('should handle empty array response from getLogs', async () => {
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.logs.data).toEqual([]);
      });
    });

    it('should handle empty object response from getConfig', async () => {
      mockedApiService.getConfig.mockResolvedValue({} as any);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.config.data).toEqual({});
      });
    });
  });

  describe('Error States', () => {
    it('should handle network errors from getModels', async () => {
      const error = new Error('Network error');
      mockedApiService.getModels.mockRejectedValue(error);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isError).toBe(true);
        expect(result.current.models.error).toEqual(error);
      });
    });

    it('should handle timeout errors from getMetrics', async () => {
      const error = new Error('Request timeout');
      mockedApiService.getMetrics.mockRejectedValue(error);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getLogs.mockResolvedValue([]);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.metrics.isError).toBe(true);
        expect(result.current.metrics.error).toEqual(error);
      });
    });

    it('should handle API errors with status codes from getLogs', async () => {
      const error = { response: { status: 500, data: { message: 'Internal server error' } } };
      mockedApiService.getLogs.mockRejectedValue(error);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getConfig.mockResolvedValue({} as any);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.logs.isError).toBe(true);
      });
    });

    it('should handle malformed JSON response from getConfig', async () => {
      const error = new SyntaxError('Unexpected token < in JSON');
      mockedApiService.getConfig.mockRejectedValue(error);
      mockedApiService.getModels.mockResolvedValue([]);
      mockedApiService.getMetrics.mockResolvedValue({} as any);
      mockedApiService.getLogs.mockResolvedValue([]);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.config.isError).toBe(true);
      });
    });

    it('should handle multiple concurrent errors', async () => {
      const modelError = new Error('Models failed');
      const metricsError = new Error('Metrics failed');
      const logsError = new Error('Logs failed');
      const configError = new Error('Config failed');

      mockedApiService.getModels.mockRejectedValue(modelError);
      mockedApiService.getMetrics.mockRejectedValue(metricsError);
      mockedApiService.getLogs.mockRejectedValue(logsError);
      mockedApiService.getConfig.mockRejectedValue(configError);

      const { result } = renderHook(() => useApi(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.models.isError).toBe(true);
        expect(result.current.metrics.isError).toBe(true);
        expect(result.current.logs.isError).toBe(true);
        expect(result.current.config.isError).toBe(true);
      });
    });
  });
}
