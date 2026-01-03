/**
 * Error handling tests for useSystemMetrics hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';
import {
  mockErrorResponse,
  mockNetworkError,
  setupBeforeEach,
  setupAfterEach,
} from './useSystemMetrics.test.helpers';

describe('useSystemMetrics - Error Handling', () => {
  beforeEach(setupBeforeEach);
  afterEach(setupAfterEach);

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(mockNetworkError);

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.metrics).toBeNull();
  });

  it('should handle 404 error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockErrorResponse(404, 'Not found')
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch metrics');
  });

  it('should handle 500 error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockErrorResponse(500, 'Internal server error')
    );

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch metrics');
  });

  it('should handle timeout errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => {
      throw new Error('Request timeout');
    });

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Request timeout');
  });

  it('should handle JSON parse errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Unexpected token');
  });

  it('should handle consecutive errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(mockNetworkError);

    const { result } = renderHook(() => useSystemMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialError = result.current.error;

    // Fast-forward past the polling interval
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(initialError);
  });
});
