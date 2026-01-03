/**
 * Loading states tests for useSystemMetrics hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';
import {
  mockSuccessResponse,
  setupBeforeEach,
  setupAfterEach,
} from './useSystemMetrics.test.helpers';

describe('useSystemMetrics - Loading States', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should be loading initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useSystemMetrics());

    expect(result.current.loading).toBe(true);
    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should transition to success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockSuccessResponse({
        cpuUsage: 50,
        memoryUsage: 60,
        memoryUsed: 8,
        memoryTotal: 16,
        uptime: 100,
        cpuCores: 8,
        timestamp: 123456,
      })
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should transition to error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBe('Failed');
  });

  it('should set loading to false on error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
  });
});
