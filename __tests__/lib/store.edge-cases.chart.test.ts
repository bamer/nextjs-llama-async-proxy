import { useStore } from '@/lib/store';
import { act } from '@testing-library/react';

describe('store edge cases - Chart Data', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useStore.setState({
        models: [],
        activeModelId: null,
        metrics: null,
        logs: [],
        settings: {
          theme: 'system' as const,
          notifications: true,
          autoRefresh: true,
        },
        status: {
          isLoading: false,
          error: null,
          llamaServerStatus: 'unknown',
        },
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
      });
    });
  });

  describe('addChartData edge cases', () => {
    it('should handle all chart types', () => {
      const chartTypes = ['cpu', 'memory', 'requests', 'gpuUtil', 'power'] as const;

      chartTypes.forEach((type) => {
        act(() => {
          useStore.getState().addChartData(type, 50);
        });
      });

      const chartHistory = useStore.getState().chartHistory;
      expect(chartHistory.cpu).toHaveLength(1);
      expect(chartHistory.memory).toHaveLength(1);
      expect(chartHistory.requests).toHaveLength(1);
      expect(chartHistory.gpuUtil).toHaveLength(1);
      expect(chartHistory.power).toHaveLength(1);
    });

    it('should handle edge values (0 and 100)', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 0);
        useStore.getState().addChartData('memory', 100);
      });

      expect(useStore.getState().chartHistory.cpu[0].value).toBe(0);
      expect(useStore.getState().chartHistory.memory[0].value).toBe(100);
    });

    it('should handle negative and large positive values', () => {
      act(() => {
        useStore.getState().addChartData('cpu', -10);
        useStore.getState().addChartData('memory', 150);
      });

      expect(useStore.getState().chartHistory.cpu[0].value).toBe(-10);
      expect(useStore.getState().chartHistory.memory[0].value).toBe(150);
    });

    it('should maintain separate arrays for each chart type', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 10);
        useStore.getState().addChartData('memory', 20);
        useStore.getState().addChartData('cpu', 15);
        useStore.getState().addChartData('memory', 25);
      });

      expect(useStore.getState().chartHistory.cpu).toHaveLength(2);
      expect(useStore.getState().chartHistory.memory).toHaveLength(2);
      expect(useStore.getState().chartHistory.cpu[0].value).toBe(10);
      expect(useStore.getState().chartHistory.cpu[1].value).toBe(15);
      expect(useStore.getState().chartHistory.memory[0].value).toBe(20);
      expect(useStore.getState().chartHistory.memory[1].value).toBe(25);
    });
  });

  describe('trimChartData edge cases', () => {
    it('should handle trimming to zero points', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().trimChartData(0);
      });

      expect(useStore.getState().chartHistory.cpu).toHaveLength(0);
    });

    it('should handle trimming to negative value (should not crash)', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().trimChartData(-10);
      });

      // Should not crash, behavior may vary
      expect(useStore.getState().chartHistory.cpu).toBeDefined();
    });

    it('should handle trimming when array has fewer points than max', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 10);
        useStore.getState().addChartData('cpu', 20);
        useStore.getState().trimChartData(10);
      });

      expect(useStore.getState().chartHistory.cpu).toHaveLength(2);
    });
  });

  describe('clearChartData edge cases', () => {
    it('should handle clearing empty chart history', () => {
      act(() => {
        useStore.getState().clearChartData();
      });

      const chartHistory = useStore.getState().chartHistory;
      expect(chartHistory.cpu).toEqual([]);
      expect(chartHistory.memory).toEqual([]);
      expect(chartHistory.requests).toEqual([]);
      expect(chartHistory.gpuUtil).toEqual([]);
      expect(chartHistory.power).toEqual([]);
    });

    it('should handle clearing partially filled chart history', () => {
      act(() => {
        useStore.getState().addChartData('cpu', 50);
        useStore.getState().addChartData('memory', 60);
        useStore.getState().clearChartData();
      });

      expect(useStore.getState().chartHistory.cpu).toEqual([]);
      expect(useStore.getState().chartHistory.memory).toEqual([]);
    });
  });
});
