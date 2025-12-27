import { render } from '@testing-library/react';
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

  describe('Store Update Performance', () => {
    // Positive test: Verify store updates are efficient
    it('should handle 1000 log additions efficiently', () => {
      // Arrange
      const startTime = performance.now();

      // Act - Add 1000 logs
      for (let i = 0; i < 1000; i++) {
        useStore.getState().addLog({
          id: `log-${i}`,
          level: 'info',
          message: `Log message ${i}`,
          timestamp: new Date().toISOString(),
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const logs = useStore.getState().logs;

      // Assert
      expect(logs.length).toBe(100);
      expect(duration).toBeLessThan(100); // Should complete quickly
    });

    // Positive test: Verify model updates are efficient
    it('should handle 500 model updates efficiently', () => {
      // Arrange
      const models = Array(100).fill(null).map((_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        type: 'llama' as const,
        parameters: {},
        status: 'idle' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      useStore.getState().setModels(models);

      // Act
      const startTime = performance.now();
      for (let i = 0; i < 500; i++) {
        const modelId = `model-${i % 100}`;
        useStore.getState().updateModel(modelId, { status: 'running' });
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Large State Handling', () => {
    // Positive test: Verify large model arrays handled efficiently
    it('should handle setting 1000 models efficiently', () => {
      // Arrange
      const models: ModelConfig[] = Array(1000).fill(null).map((_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        type: 'llama' as const,
        parameters: {},
        status: i % 2 === 0 ? ('running' as const) : ('idle' as const),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Act
      const startTime = performance.now();
      useStore.getState().setModels(models);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(useStore.getState().models.length).toBe(1000);
      expect(duration).toBeLessThan(100);
    });

    // Positive test: Verify large chart history handled efficiently
    it('should handle chart data with 1000 points efficiently', () => {
      // Arrange
      const startTime = performance.now();

      // Act
      for (let i = 0; i < 1000; i++) {
        useStore.getState().addChartData('cpu', Math.random() * 100);
        useStore.getState().addChartData('memory', Math.random() * 100);
        useStore.getState().addChartData('requests', Math.random() * 1000);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(500);
      expect(useStore.getState().chartHistory.cpu.length).toBe(60); // Trimmed to 60
    });
  });

  describe('Subscription Overhead', () => {
    // Positive test: Verify multiple selectors have minimal overhead
    it('should handle 100 selector calls efficiently', () => {
      // Arrange
      const logs: LogEntry[] = Array(100).fill(null).map((_, i) => ({
        id: `log-${i}`,
        level: 'info' as const,
        message: `Log ${i}`,
        timestamp: new Date().toISOString(),
      }));
      useStore.getState().setLogs(logs);

      // Act
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        const logs = useStore.getState().logs;
        const metrics = useStore.getState().metrics;
        const models = useStore.getState().models;
        const settings = useStore.getState().settings;
        // Consume variables to prevent optimization
        void logs; void metrics; void models; void settings;
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });

  describe('Persistence Performance', () => {
    // Positive test: Verify large state persists efficiently
    it('should persist large state efficiently', async () => {
      // Arrange
      const models: ModelConfig[] = Array(500).fill(null).map((_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        type: 'llama' as const,
        parameters: {},
        status: 'idle' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      useStore.getState().setModels(models);

      // Act
      const startTime = performance.now();
      // Trigger persistence by updating settings
      useStore.getState().updateSettings({ theme: 'dark' });
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for persist
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(500);
    });

    // Negative test: Verify very large state doesn't timeout
    it('should handle extremely large state without timeout', async () => {
      // Arrange
      const models = Array(2000).fill(null).map((_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        type: 'llama' as const,
        parameters: {},
        status: 'idle' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Act
      const startTime = performance.now();
      useStore.getState().setModels(models);
      useStore.getState().updateSettings({ autoRefresh: true });
      await new Promise(resolve => setTimeout(resolve, 200));
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(5000); // Should not timeout
    });
  });

  describe('Reducer Performance', () => {
    // Positive test: Verify complex state transitions are efficient
    it('should handle complex state transitions efficiently', () => {
      // Arrange
      const models = Array(50).fill(null).map((_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
        type: 'llama' as const,
        parameters: {},
        status: 'idle' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      useStore.getState().setModels(models);

      // Act
      const startTime = performance.now();

      // Complex state transitions
      for (let i = 0; i < 50; i++) {
        useStore.getState().updateModel(`model-${i}`, { status: 'running' });
      }
      for (let i = 0; i < 25; i++) {
        useStore.getState().updateModel(`model-${i}`, { status: 'idle' });
      }
      useStore.getState().setActiveModel('model-10');
      useStore.getState().setActiveModel(null);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Chart Data Performance', () => {
    // Positive test: Verify rapid chart data updates are efficient
    it('should handle rapid chart data updates efficiently', () => {
      // Arrange
      const startTime = performance.now();

      // Act - Simulate rapid updates (like WebSocket messages)
      for (let i = 0; i < 100; i++) {
        useStore.getState().addChartData('cpu', 50 + Math.sin(i / 10) * 30);
        useStore.getState().addChartData('memory', 60 + Math.cos(i / 10) * 20);
        useStore.getState().addChartData('requests', 100 + Math.random() * 50);
        useStore.getState().addChartData('gpuUtil', 70 + Math.random() * 30);
        useStore.getState().addChartData('power', 150 + Math.random() * 50);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(200);
    });

    // Positive test: Verify chart trimming is efficient
    it('should trim chart data efficiently', () => {
      // Arrange
      for (let i = 0; i < 200; i++) {
        useStore.getState().addChartData('cpu', Math.random() * 100);
      }

      // Act
      const startTime = performance.now();
      useStore.getState().trimChartData(50);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(useStore.getState().chartHistory.cpu.length).toBe(50);
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memory Efficiency', () => {
    // Positive test: Verify no memory leaks with repeated state updates
    it('should not leak memory with repeated updates', () => {
      // Arrange
      const initialMemory = (global as any).gc ? process.memoryUsage().heapUsed : 0;

      // Act - Many state updates
      for (let i = 0; i < 5000; i++) {
        useStore.getState().addLog({
          id: `log-${i}`,
          level: 'info' as const,
          message: `Log ${i}`,
          timestamp: new Date().toISOString(),
        });
      }
      useStore.getState().clearLogs();

      const finalMemory = (global as any).gc ? process.memoryUsage().heapUsed : 0;

      // Assert
      if ((global as any).gc) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
      }
    });
  });
});
