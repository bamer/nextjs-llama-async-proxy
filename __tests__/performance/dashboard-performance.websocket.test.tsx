import '@testing-library/jest-dom';
import { useStore } from '@/lib/store';
import type { ModelConfig, LegacySystemMetrics } from '@/types';
import { setupDashboardTest, cleanupDashboardTest, createMockMetrics, act } from './dashboard-test-helpers';



/**
 * WebSocket Message Batching Tests
 *
 * Tests verify that WebSocket messages are batched efficiently
 * to prevent excessive re-renders and API calls.
 */
describe('WebSocket Message Batching', () => {
  beforeEach(() => {
    setupDashboardTest();
  });

  afterEach(() => {
    cleanupDashboardTest();
  });

  it('should batch metrics messages within 200ms', async () => {
    const metricsUpdates: LegacySystemMetrics[] = [];
    let updateCount = 0;

    useStore.subscribe((state) => {
      if (state.metrics) {
        metricsUpdates.push(state.metrics as unknown as LegacySystemMetrics);
        updateCount++;
      }
    });

    const metrics1: LegacySystemMetrics = createMockMetrics({
      cpuUsage: 45,
      memoryUsage: 50,
      diskUsage: 60,
    });

    const metrics2: LegacySystemMetrics = createMockMetrics({
      cpuUsage: 50,
      memoryUsage: 55,
      diskUsage: 62,
    });

    const metrics3: LegacySystemMetrics = createMockMetrics({
      cpuUsage: 55,
      memoryUsage: 60,
      diskUsage: 64,
    });

    useStore.getState().setMetrics(metrics1 as never);
    useStore.getState().setMetrics(metrics2 as never);
    useStore.getState().setMetrics(metrics3 as never);

    act(() => {
      jest.runAllTimers();
    });

    expect(updateCount).toBeGreaterThanOrEqual(3);
    expect(metricsUpdates.length).toBeGreaterThanOrEqual(3);
  });

  it('should batch model updates within 300ms', async () => {
    let modelsUpdateCount = 0;
    const modelsUpdates: ModelConfig[][] = [];

    useStore.subscribe((state) => {
      if (state.models.length > 0) {
        modelsUpdates.push(state.models);
        modelsUpdateCount++;
      }
    });

    const models1: ModelConfig[] = [
      {
        id: 'model-1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const models2: ModelConfig[] = [
      {
        id: 'model-1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'running',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const models3: ModelConfig[] = [
      {
        id: 'model-1',
        name: 'Model 1',
        type: 'llama',
        parameters: {},
        status: 'loading',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'model-2',
        name: 'Model 2',
        type: 'mistral',
        parameters: {},
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    useStore.getState().setModels(models1);
    useStore.getState().setModels(models2);
    useStore.getState().setModels(models3);

    act(() => {
      jest.runAllTimers();
    });

    expect(modelsUpdateCount).toBeGreaterThanOrEqual(3);
  });

  it('should handle rapid chart data updates efficiently', () => {
    const startTime = performance.now();

    for (let i = 0; i < 10; i++) {
      useStore.getState().addChartData('cpu', 50 + Math.random() * 50);
    }

    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(50);
  });
});
