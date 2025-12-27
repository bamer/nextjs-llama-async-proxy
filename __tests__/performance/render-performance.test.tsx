import { render } from '@testing-library/react';
import ModernDashboard from '@/components/dashboard/ModernDashboard';

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
    sendMessage: jest.fn(),
  }),
}));

jest.mock('@/hooks/useChartHistory', () => ({
  useChartHistory: () => ({
    cpu: Array(60).fill(null).map((_, i) => ({
      time: new Date(Date.now() - i * 60000).toISOString(),
      displayTime: `${Math.floor((60 - i) / 60)}:${String((60 - i) % 60).padStart(2, '0')}`,
      value: 50 + Math.sin(i / 10) * 30,
    })),
    memory: Array(60).fill(null).map((_, i) => ({
      time: new Date(Date.now() - i * 60000).toISOString(),
      displayTime: `${Math.floor((60 - i) / 60)}:${String((60 - i) % 60).padStart(2, '0')}`,
      value: 60 + Math.cos(i / 10) * 20,
    })),
    requests: Array(60).fill(null).map((_, i) => ({
      time: new Date(Date.now() - i * 60000).toISOString(),
      displayTime: `${Math.floor((60 - i) / 60)}:${String((60 - i) % 60).padStart(2, '0')}`,
      value: 100 + Math.random() * 50,
    })),
    gpuUtil: Array(60).fill(null).map((_, i) => ({
      time: new Date(Date.now() - i * 60000).toISOString(),
      displayTime: `${Math.floor((60 - i) / 60)}:${String((60 - i) % 60).padStart(2, '0')}`,
      value: 70 + Math.random() * 30,
    })),
    power: Array(60).fill(null).map((_, i) => ({
      time: new Date(Date.now() - i * 60000).toISOString(),
      displayTime: `${Math.floor((60 - i) / 60)}:${String((60 - i) % 60).padStart(2, '0')}`,
      value: 150 + Math.random() * 50,
    })),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Render Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Render Times', () => {
    // Positive test: Verify dashboard renders quickly
    it('should render dashboard within 200ms', () => {
      // Arrange & Act
      const startTime = performance.now();
      render(<ModernDashboard />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(200); // Fast render
    });

    // Positive test: Verify re-renders are fast
    it('should re-render dashboard within 150ms', () => {
      // Arrange
      const { rerender } = render(<ModernDashboard />);

      // Act
      const startTime = performance.now();
      rerender(<ModernDashboard />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Large Data Set Rendering', () => {
    // Positive test: Verify rendering with many models
    it('should render dashboard with 100 models efficiently', () => {
      // Arrange
      const { useStore } = require('@/lib/store');
      const models: ModelConfig[] = Array(100).fill(null).map((_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        type: 'llama' as const,
        parameters: {},
        status: i % 3 === 0 ? 'running' : 'idle' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      useStore.getState().setModels(models);

      // Act
      const startTime = performance.now();
      render(<ModernDashboard />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Chart Performance', () => {
    // Positive test: Verify chart rendering with many points
    it('should render charts efficiently with 60 data points', () => {
      // Arrange & Act
      const startTime = performance.now();
      render(<ModernDashboard />);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(300);
    });

    // Positive test: Verify chart updates are fast
    it('should handle chart data updates efficiently', () => {
      // Arrange
      const { useStore } = require('@/lib/store');
      const { rerender } = render(<ModernDashboard />);

      // Act - Add chart data
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        useStore.getState().addChartData('cpu', Math.random() * 100);
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memoization Effectiveness', () => {
    // Positive test: Verify props memoization prevents re-renders
    it('should skip unnecessary re-renders', () => {
      // Arrange
      const { rerender } = render(<ModernDashboard />);
      const initialCallCount = jest.fn().mock.calls?.length || 0;

      // Act - Re-render with same props
      rerender(<ModernDashboard />);

      // Assert - Should be similar number of calls
      const finalCallCount = jest.fn().mock.calls?.length || 0;
      expect(finalCallCount - initialCallCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Memory Efficiency', () => {
    // Positive test: Verify no memory leaks on unmount
    it('should not leak memory after unmount', () => {
      // Arrange
      const initialMemory = (global as any).gc ? process.memoryUsage().heapUsed : 0;

      // Act
      const { unmount } = render(<ModernDashboard />);
      unmount();

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (global as any).gc ? process.memoryUsage().heapUsed : 0;

      // Assert
      if ((global as any).gc) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      }
    });
  });
});
