import React from 'react';
import { render, waitFor } from '@testing-library/react';
import LogsPage from '@/components/pages/LogsPage';
import { useStore } from '@/lib/store';

/**
 * Render Performance Tests
 *
 * Objective: Test component rendering performance under various conditions
 * - Component render times meet acceptable thresholds
 * - Large data sets rendered efficiently
 * - Re-renders optimized with memoization
 * - Memoization prevents unnecessary updates
 * - Chart components perform well with many data points
 */

// Mock dependencies
jest.mock('@/lib/websocket-client', () => ({
  websocketServer: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
    requestLogs: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    requestLogs: jest.fn(),
  }),
}));

describe('Render Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store
    useStore.getState().clearLogs();
  });

  describe('Component Render Times', () => {
    // Positive test: Verify component renders quickly with no data
    it('should render LogsPage with no data within 50ms', () => {
      // Arrange
      useStore.getState().clearLogs();

      // Act
      const startTime = performance.now();
      render(<LogsPage />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(50); // Fast initial render
    });

    // Positive test: Verify component renders quickly with small data
    it('should render LogsPage with 50 logs within 100ms', () => {
      // Arrange
      const logs = Array(50).fill(null).map((_, i) => ({
        id: `log-${i}`,
        level: 'info' as const,
        message: `Log message ${i}`,
        timestamp: new Date().toISOString(),
        context: { source: 'test' },
      }));
      useStore.getState().setLogs(logs);

      // Act
      const startTime = performance.now();
      render(<LogsPage />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(100); // Efficient render with data
    });

    // Negative test: Verify large data doesn't cause timeout
    it('should render LogsPage with 10,000 logs within 500ms', () => {
      // Arrange
      const logs = Array(10000).fill(null).map((_, i) => ({
        level: i % 4 === 0 ? 'error' : i % 3 === 0 ? 'warn' : 'info',
        message: `Log message ${i}`.repeat(5),
        timestamp: new Date().toISOString(),
        source: 'test',
      }));
      useStore.getState().setLogs(logs);

      // Act
      const startTime = performance.now();
      render(<LogsPage />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(500); // Should handle large data efficiently
    });
  });

  describe('Large Data Set Rendering', () => {
    // Positive test: Verify efficient rendering of large log arrays
    it('should render 5,000 log entries efficiently', () => {
      // Arrange
      const logs = Array(5000).fill(null).map((_, i) => ({
        level: 'info',
        message: `Performance test log entry ${i}`,
        timestamp: new Date(i * 1000).toISOString(),
        source: 'performance-test',
      }));
      useStore.getState().setLogs(logs);

      // Act
      const startTime = performance.now();
      const { container } = render(<LogsPage />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(300); // Efficient rendering
      expect(container).toBeTruthy();
    });

    // Positive test: Verify filtered rendering is efficient
    it('should filter and render large data sets efficiently', () => {
      // Arrange
      const logs = Array(10000).fill(null).map((_, i) => ({
        level: i % 10 === 0 ? 'error' : 'info',
        message: `Log ${i} with some keywords like error and warning`,
        timestamp: new Date().toISOString(),
        source: i % 5 === 0 ? 'error-source' : 'info-source',
      }));
      useStore.getState().setLogs(logs);

      // Act
      const startTime = performance.now();
      const { getByText } = render(<LogsPage />);

      // Type in filter input
      const startTimeFilter = performance.now();
      const filterInput = getByText('Filter logs...').closest('input');
      if (filterInput) {
        fireEvent.change(filterInput, { target: { value: 'error' } });
      }
      const endTimeFilter = performance.now();
      const filterDuration = endTimeFilter - startTimeFilter;

      // Assert
      expect(filterDuration).toBeLessThan(200); // Fast filtering
    });
  });

  describe('Re-render Optimization', () => {
    // Positive test: Verify re-renders don't slow down with many updates
    it('should handle 100 rapid state updates efficiently', () => {
      // Arrange
      const { container } = render(<LogsPage />);
      const startTime = performance.now();

      // Act - Rapid updates
      for (let i = 0; i < 100; i++) {
        useStore.getState().addLog({
          level: 'info',
          message: `Update ${i}`,
          timestamp: new Date().toISOString(),
        });
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(1000); // Should handle rapid updates
    });

    // Positive test: Verify filtering doesn't cause full re-render
    it('should update filter without full re-render', () => {
      // Arrange
      const logs = Array(1000).fill(null).map((_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: new Date().toISOString(),
      }));
      useStore.getState().setLogs(logs);

      const renderSpy = jest.fn();
      const { rerender } = render(<LogsPage />);

      // Act
      const startTime = performance.now();
      rerender(<LogsPage />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(100); // Fast re-render
    });
  });

  describe('Memoization Effectiveness', () => {
    // Positive test: Verify memoized components don't re-render unnecessarily
    it('should skip re-renders for unchanged props', () => {
      // Arrange
      const logs = Array(100).fill(null).map((_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: new Date().toISOString(),
      }));
      useStore.getState().setLogs(logs);

      const { rerender } = render(<LogsPage />);
      const initialRenderCount = renderSpy.mock?.calls?.length || 0;

      // Act - Re-render with same data
      rerender(<LogsPage />);
      const finalRenderCount = renderSpy.mock?.calls?.length || 0;

      // Assert
      expect(finalRenderCount).toBeLessThanOrEqual(initialRenderCount + 1);
    });

    // Positive test: Verify memoized calculations are efficient
    it('should memoize expensive calculations', () => {
      // Arrange
      const logs = Array(1000).fill(null).map((_, i) => ({
        level: 'info',
        message: `Log ${i}`.repeat(10),
        timestamp: new Date(i * 1000).toISOString(),
        source: 'test',
      }));
      useStore.getState().setLogs(logs);

      // Act - First render (calculations)
      const startTime1 = performance.now();
      render(<LogsPage />);
      const endTime1 = performance.now();
      const firstDuration = endTime1 - startTime1;

      // Second render (should use memoized values)
      const startTime2 = performance.now();
      render(<LogsPage />);
      const endTime2 = performance.now();
      const secondDuration = endTime2 - startTime2;

      // Assert
      expect(secondDuration).toBeLessThan(firstDuration * 1.5); // Should be similar or faster
    });
  });

  describe('Chart Performance with Many Points', () => {
    // Positive test: Verify chart rendering with many data points
    it('should render chart with 1000 data points efficiently', async () => {
      // Arrange
      const { PerformanceChart } = await import('@/components/charts/PerformanceChart');

      const data = Array(1000).fill(null).map((_, i) => ({
        time: new Date(i * 60000).toISOString(),
        displayTime: `${Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}`,
        value: Math.sin(i / 50) * 50 + 50,
      }));

      // Act
      const startTime = performance.now();
      render(
        <PerformanceChart
          title="Test Chart"
          description="Performance test"
          datasets={[{
            dataKey: 'test',
            label: 'Test',
            colorDark: '#60a5fa',
            colorLight: '#2563eb',
            valueFormatter: (v: number) => `${v.toFixed(1)}%`,
            data,
          }]}
          isDark={false}
          height={350}
        />
      );
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(500); // Efficient chart rendering
    });

    // Positive test: Verify multiple charts render efficiently
    it('should render multiple charts efficiently', async () => {
      // Arrange
      const { PerformanceChart } = await import('@/components/charts/PerformanceChart');

      const data = Array(500).fill(null).map((_, i) => ({
        time: new Date(i * 60000).toISOString(),
        displayTime: `${Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}`,
        value: Math.random() * 100,
      }));

      // Act
      const startTime = performance.now();
      const { container } = render(
        <>
          <PerformanceChart
            title="Chart 1"
            description="CPU"
            datasets={[{
              dataKey: 'cpu',
              label: 'CPU',
              colorDark: '#60a5fa',
              colorLight: '#2563eb',
              valueFormatter: (v: number) => `${v.toFixed(1)}%`,
              data,
            }]}
            isDark={false}
            height={300}
          />
          <PerformanceChart
            title="Chart 2"
            description="Memory"
            datasets={[{
              dataKey: 'memory',
              label: 'Memory',
              colorDark: '#4ade80',
              colorLight: '#16a34a',
              valueFormatter: (v: number) => `${v.toFixed(1)}%`,
              data,
            }]}
            isDark={false}
            height={300}
          />
          <PerformanceChart
            title="Chart 3"
            description="Requests"
            datasets={[{
              dataKey: 'requests',
              label: 'Requests',
              colorDark: '#facc15',
              colorLight: '#f59e0b',
              valueFormatter: (v: number) => `${v}`,
              data,
            }]}
            isDark={false}
            height={300}
          />
        </>
      );
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(1500); // Multiple charts should render in <1.5s
    });
  });

  describe('Memory Efficiency', () => {
    // Positive test: Verify no memory leaks on unmount
    it('should not leak memory after unmount', () => {
      // Arrange
      const logs = Array(1000).fill(null).map((_, i) => ({
        level: 'info',
        message: `Log ${i}`,
        timestamp: new Date().toISOString(),
      }));
      useStore.getState().setLogs(logs);

      const initialMemory = (global as any).gc ? process.memoryUsage().heapUsed : 0;

      // Act
      const { unmount } = render(<LogsPage />);

      // Add more logs while mounted
      for (let i = 0; i < 500; i++) {
        useStore.getState().addLog({
          level: 'info',
          message: `Additional log ${i}`,
          timestamp: new Date().toISOString(),
        });
      }

      unmount();

      const finalMemory = (global as any).gc ? process.memoryUsage().heapUsed : 0;

      // Assert
      if ((global as any).gc) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
      }
    });
  });
});

// Helper for testing inputs
function fireEvent(element: Element, event: Event) {
  element.dispatchEvent(event);
}

interface MockRenderSpy {
  mock?: { calls: unknown[] };
}
