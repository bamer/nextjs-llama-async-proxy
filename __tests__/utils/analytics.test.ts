import * as analytics from '@/lib/analytics';

jest.mock('@/lib/analytics');
const mockAnalytics = analytics as jest.Mocked<typeof analytics>;

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  describe('trackEvent', () => {
    it('should track event with name and properties', () => {
      analytics.trackEvent('model_loaded', { modelId: 'model1', loadTime: 500 });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'model_loaded',
        { modelId: 'model1', loadTime: 500 }
      );
    });

    it('should handle optional properties', () => {
      analytics.trackEvent('config_updated', {
        key: 'max_concurrent_models',
        oldValue: 5,
        newValue: 10,
      });

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'config_updated',
        expect.objectContaining({
          key: 'max_concurrent_models',
        })
      );
    });
  });

  describe('trackPageView', () => {
    it('should track page view with path', () => {
      analytics.trackPageView('/dashboard');

      expect(mockAnalytics.trackPageView).toHaveBeenCalledWith('/dashboard');
    });

    it('should track page view with additional data', () => {
      const pageData = {
        title: 'Dashboard',
        referrer: '/settings',
      };

      analytics.trackPageView('/dashboard', pageData);

      expect(mockAnalytics.trackPageView).toHaveBeenCalledWith('/dashboard', pageData);
    });
  });

  describe('trackUserAction', () => {
    it('should track user action with type and details', () => {
      analytics.trackUserAction('button_click', {
        buttonId: 'start_model_btn',
        buttonText: 'Start Model',
      });

      expect(mockAnalytics.trackUserAction).toHaveBeenCalledWith(
        'button_click',
        expect.objectContaining({
          buttonId: 'start_model_btn',
        })
      );
    });

    it('should handle action with no details', () => {
      analytics.trackUserAction('menu_open');

      expect(mockAnalytics.trackUserAction).toHaveBeenCalledWith('menu_open', undefined);
    });
  });

  describe('trackError', () => {
    it('should track error with message and details', () => {
      const error = new Error('Failed to load model');
      const errorDetails = {
        component: 'ModelLoader',
        action: 'loadModel',
        code: 'LOAD_FAILED',
        stack: error.stack,
      };

      analytics.trackError('load_model_failed', 'Failed to load model', errorDetails);

      expect(mockAnalytics.trackError).toHaveBeenCalledWith(
        'load_model_failed',
        'Failed to load model',
        errorDetails
      );
    });

    it('should handle errors without stack', () => {
      analytics.trackError('api_error', 'API request failed');

      expect(mockAnalytics.trackError).toHaveBeenCalledWith(
        'api_error',
        'API request failed',
        expect.any(Object)
      );
    });
  });

  describe('trackMetric', () => {
    it('should track numeric metric with name and value', () => {
      analytics.trackMetric('api_response_time_ms', 250);

      expect(mockAnalytics.trackMetric).toHaveBeenCalledWith('api_response_time_ms', 250);
    });

    it('should track metric with unit', () => {
      analytics.trackMetric('model_size_gb', 12.5);

      expect(mockAnalytics.trackMetric).toHaveBeenCalledWith('model_size_gb', 12.5);
    });

    it('should handle optional tags', () => {
      analytics.trackMetric('request_count', 100, { endpoint: '/api/models' });

      expect(mockAnalytics.trackMetric).toHaveBeenCalledWith(
        'request_count',
        100,
        { endpoint: '/api/models' }
      );
    });
  });

  describe('getEventHistory', () => {
    it('should return event history', () => {
      const mockEvents = [
        {
          type: 'event',
          name: 'model_loaded',
          timestamp: new Date('2024-01-01T00:00:00Z').getTime(),
          data: { modelId: 'model1' },
        },
        {
          type: 'event',
          name: 'model_loaded',
          timestamp: new Date('2024-01-01T00:01:00Z').getTime(),
          data: { modelId: 'model2' },
        },
      ];

      mockAnalytics.getEventHistory.mockReturnValue(mockEvents);

      const history = analytics.getEventHistory();

      expect(history).toEqual(mockEvents);
      expect(mockAnalytics.getEventHistory).toHaveBeenCalled();
    });

    it('should limit history size', () => {
      const mockEvents = Array(150).fill({
        type: 'event',
        name: 'test_event',
        timestamp: Date.now(),
        data: {},
      });

      mockAnalytics.getEventHistory.mockReturnValue(mockEvents);

      const history = analytics.getEventHistory();

      expect(history).toHaveLength(100);
    });
  });

  describe('getMetrics', () => {
    it('should return aggregated metrics', () => {
      const mockMetrics = {
        totalEvents: 150,
        totalErrors: 5,
        avgResponseTime: 250,
        uniqueUsers: 10,
        errorRate: 3.33,
      };

      mockAnalytics.getMetrics.mockReturnValue(mockMetrics);

      const metrics = analytics.getMetrics();

      expect(metrics).toEqual(mockMetrics);
      expect(mockAnalytics.getMetrics).toHaveBeenCalled();
    });

    it('should calculate error rate correctly', () => {
      const mockEvents = [
        { type: 'event' },
        { type: 'event' },
        { type: 'event' },
        { type: 'error' },
        { type: 'event' },
        { type: 'event' },
        { type: 'error' },
        { type: 'event' },
        { type: 'event' },
        { type: 'error' },
      ];

      mockAnalytics.getEventHistory.mockReturnValue(mockEvents);
      mockAnalytics.getMetrics.mockReturnValue({ totalEvents: 10, totalErrors: 2 });

      const metrics = analytics.getMetrics();

      expect(metrics.errorRate).toBe(20);
    });
  });

  describe('clear', () => {
    it('should clear all analytics data', () => {
      analytics.clear();

      expect(mockAnalytics.clear).toHaveBeenCalled();
      expect(mockAnalytics.getEventHistory.mockClear).toHaveBeenCalled();
      expect(mockAnalytics.getMetrics.mockClear).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should support event tracking flow', () => {
      mockAnalytics.getEventHistory.mockReturnValue([]);

      analytics.trackEvent('test_event', { data: 'test' });
      analytics.trackEvent('another_test', { data: 'another' });
      analytics.trackEvent('error_event', { error: new Error('Test error') });

      const history = analytics.getEventHistory();

      expect(history).toHaveLength(3);
      expect(mockAnalytics.trackEvent).toHaveBeenCalledTimes(3);
    });

    it('should persist events across mock cycles', () => {
      mockAnalytics.getEventHistory.mockReturnValue([]);

      analytics.trackEvent('persistent_event', { id: 1 });

      mockAnalytics.getEventHistory.mockReset();
      const history1 = analytics.getEventHistory();
      expect(history1).toHaveLength(1);

      mockAnalytics.getEventHistory.mockReset();
      const history2 = analytics.getEventHistory();
      expect(history2).toHaveLength(1);

      expect(history1[0]).toEqual(history2[0]);
    });
  });

  describe('localStorage integration', () => {
    it('should persist analytics in localStorage', () => {
      analytics.trackEvent('test_event', { value: 1 });

      const stored = localStorage.getItem('analytics_events');
      expect(stored).not.toBeNull();
    });

    it('should load from localStorage on init', () => {
      const mockStoredEvents = JSON.stringify([
        { type: 'event', name: 'loaded_event' },
      ]);
      localStorage.setItem('analytics_events', mockStoredEvents);

      analytics.trackEvent('new_event');

      const history = analytics.getEventHistory();

      expect(history).toContainEqual(
        expect.objectContaining({ name: 'loaded_event' })
      );
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('analytics_events', 'invalid json{{{');

      const history = analytics.getEventHistory();

      expect(history).toEqual([]);
    });
  });

  describe('data formatting', () => {
    it('should format timestamps as ISO strings', () => {
      const timestamp = Date.now();
      analytics.trackEvent('test_event', { timestamp });

      const history = analytics.getEventHistory();

      expect(history[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should preserve event data structure', () => {
      const eventData = {
        key1: 'value1',
        key2: 'value2',
        nested: {
          deep: { data: 'test' },
        },
      };

      analytics.trackEvent('structured_event', eventData);

      const history = analytics.getEventHistory();

      expect(history[0].data).toEqual(eventData);
    });
  });
});
