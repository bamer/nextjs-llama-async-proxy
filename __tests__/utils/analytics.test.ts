import { captureMetrics } from '@/lib/monitor';
import { join } from 'path';

jest.mock('@/lib/monitor');
jest.mock('path');

const mockCaptureMetrics = captureMetrics as jest.MockedFunction<typeof captureMetrics>;
const mockJoin = join as jest.MockedFunction<typeof join>;

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
    it('should capture metrics on event', () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      const result = analytics.trackEvent('model_loaded', {
        modelId: 'model1',
        loadTime: 500,
      });

      expect(result).toBeUndefined();
      expect(mockCaptureMetrics).toHaveBeenCalledWith('model_loaded', expect.any(Object));
    });

    it('should track page view', () => {
      analytics.trackPageView('/dashboard');

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture).toContainEqual('/dashboard');
    });

    it('should track user action', () => {
      const actionData = {
        buttonId: 'save_config',
        buttonText: 'Save',
        formSection: 'general',
      };

      analytics.trackUserAction('button_click', actionData);

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture[0]).toContain('button_click');
      expect(lastCapture[0]).toContain('save_config');
    });

    it('should track error', () => {
      const error = new Error('Failed to load model');
      const errorDetails = {
        component: 'ModelLoader',
        action: 'loadModel',
        code: 'LOAD_FAILED',
        stack: error.stack,
      };

      analytics.trackError('model_load_failed', 'Failed to load model', errorDetails);

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture[0]).toBe('error');
      expect(lastCapture[0]).toContain('model_load_failed');
      expect(lastCapture[1]).toContain('Failed to load model');
    });
  });

  describe('trackPageView', () => {
    it('should capture page view with path and referrer', () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      analytics.trackPageView('/settings', '/dashboard');

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture).toContainEqual('/settings');
    });

    it('should capture page view with additional data', () => {
      const pageData = {
        title: 'Dashboard',
        sessionId: 'session123',
        viewport: 'mobile',
      };

      mockCaptureMetrics.mockResolvedValue(undefined);

      analytics.trackPageView('/dashboard', '/models', pageData);

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture).toContain('/dashboard');
      expect(lastCapture[0]).toContainEqual(pageData);
    });
  });

  describe('trackUserAction', () => {
    it('should track button clicks', () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      const actionData = {
        buttonId: 'start_model',
        buttonText: 'Start',
        section: 'models',
      };

      analytics.trackUserAction('button_click', actionData);

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture[0]).toBe('button_click');
      expect(lastCapture[1]).toContain('start_model');
    });

    it('should track menu actions', () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      analytics.trackUserAction('menu_open', {
        menuId: 'settings',
        menuSection: 'general',
      });

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture[0]).toBe('menu_open');
      expect(lastCapture[1]).toContainEqual({ menuId: 'settings', menuSection: 'general' });
    });

    it('should track form interactions', () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      const formData = {
        formId: 'server_config',
        field: 'host',
        fieldType: 'input',
        value: 'localhost',
      };

      analytics.trackUserAction('form_change', formData);

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture[0]).toBe('form_change');
      expect(lastCapture[1]).toContainEqual(formData);
    });
  });

  describe('trackMetric', () => {
    it('should track numeric metric', () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      analytics.trackMetric('api_response_time_ms', 250);

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture[0]).toBe('api_response_time_ms');
      expect(lastCapture[1]).toBe(250);
    });

    it('should track metric with unit', () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      analytics.trackMetric('model_size_gb', 12.5);

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture[0]).toBe('model_size_gb');
      expect(lastCapture[1]).toBe(12.5);
    });

    it('should track metric with tags', () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      const metricData = {
        endpoint: '/api/models',
        method: 'POST',
        status: 200,
      };

      analytics.trackMetric('api_request', 1, metricData);

      const lastCapture = mockCaptureMetrics.mock.calls[mockCaptureMetrics.mock.calls.length - 1];
      expect(lastCapture[0]).toBe('api_request');
      expect(lastCapture[1]).toBe(1);
      expect(lastCapture[2]).toContainEqual(metricData);
    });
  });

  describe('getEventHistory', () => {
    it('should return tracked events', () => {
      const mockEvents = [
        { type: 'event', name: 'model_loaded', timestamp: 1704067200000, data: { modelId: 'model1' } },
        { type: 'event', name: 'page_view', timestamp: 1704067300000, data: { path: '/dashboard' } },
      ];

      mockCaptureMetrics.getEvents.mockResolvedValue(mockEvents);

      const history = analytics.getEventHistory(10);

      expect(history).toHaveLength(10);
      expect(history[0].type).toBe('event');
      expect(history[0].name).toBe('model_loaded');
    });

    it('should limit history size', () => {
      const mockEvents = Array(200).fill({
        type: 'event',
        name: 'test_event',
        timestamp: Date.now(),
        data: {},
      });

      mockCaptureMetrics.getEvents.mockResolvedValue(mockEvents);

      const history = analytics.getEventHistory(100);

      expect(history).toHaveLength(100);
    });

    it('should return empty history when no events', () => {
      mockCaptureMetrics.getEvents.mockResolvedValue([]);

      const history = analytics.getEventHistory();

      expect(history).toEqual([]);
    });
  });

  describe('getMetrics', () => {
    it('should return aggregated metrics', () => {
      const mockMetrics = {
        totalEvents: 500,
        totalErrors: 25,
        totalRequests: 1000,
        avgResponseTime: 300,
        errorRate: 2.5,
        uniqueUsers: 50,
        requestsPerMinute: 15,
      };

      mockCaptureMetrics.getMetrics.mockResolvedValue(mockMetrics);

      const metrics = analytics.getMetrics();

      expect(metrics).toEqual(mockMetrics);
      expect(mockCaptureMetrics.getMetrics).toHaveBeenCalled();
    });

    it('should calculate error rate', () => {
      const mockEvents = Array(100).fill({ type: 'event' });
      mockEvents.push({ type: 'error' });

      mockCaptureMetrics.getEvents.mockResolvedValue(mockEvents);
      mockCaptureMetrics.getEvents.mockResolvedValue([]);

      const metrics = analytics.getMetrics();

      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorRate).toBe(1);
    });

    it('should calculate requests per minute', () => {
      const mockEvents = Array(60).fill({ type: 'event', name: 'api_request' });

      mockCaptureMetrics.getEvents.mockResolvedValue(mockEvents);
      const metrics = analytics.getMetrics();

      expect(metrics.requestsPerMinute).toBeGreaterThanOrEqual(60);
    });
  });

  describe('getUniqueUsers', () => {
    it('should return unique user count', () => {
      const mockSessions = [
        { userId: 'user1', startedAt: Date.now() - 3600000, lastActive: Date.now() },
        { userId: 'user2', startedAt: Date.now() - 7200000, lastActive: Date.now() - 1800000 },
      ];

      mockCaptureMetrics.getSessions.mockResolvedValue(mockSessions);

      const count = analytics.getUniqueUsers();

      expect(count).toBe(2);
    });

    it('should handle no sessions', () => {
      mockCaptureMetrics.getSessions.mockResolvedValue([]);

      const count = analytics.getUniqueUsers();

      expect(count).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all analytics data', () => {
      mockCaptureMetrics.clear.mockResolvedValue(undefined);

      analytics.clear();

      expect(mockCaptureMetrics.clear).toHaveBeenCalled();
      expect(mockCaptureMetrics.clearEvents.mockResolvedValue(undefined).toHaveBeenCalled();
      expect(mockCaptureMetrics.clearSessions.mockResolvedValue(undefined).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should support event → metrics flow', async () => {
      mockCaptureMetrics.mockResolvedValue(undefined);

      analytics.trackEvent('test_event', { data: 'test' });
      analytics.trackMetric('test_metric', 100);

      const metrics = analytics.getMetrics();

      expect(mockCaptureMetrics.getEvents).toHaveBeenCalled();
      expect(mockCaptureMetrics.getMetrics).toHaveBeenCalled();
      expect(metrics.totalEvents).toBeGreaterThan(0);
    });

    it('should aggregate events correctly', async () => {
      const mockEvents = [
        { type: 'event', name: 'api_request' },
        { type: 'event', name: 'api_request' },
        { type: 'event', name: 'api_request' },
      ];

      mockCaptureMetrics.getEvents.mockResolvedValue(mockEvents);

      const metrics = analytics.getMetrics();

      expect(metrics.totalRequests).toBeDefined();
    });
  });
});
