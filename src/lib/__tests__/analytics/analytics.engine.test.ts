import { analyticsEngine } from '@/lib/analytics';
import { resetAnalyticsEngine } from './analytics.test-utils';

describe('AnalyticsEngine', () => {
  beforeEach(() => {
    resetAnalyticsEngine();
  });

  describe('incRequest', () => {
    it('increments active sessions', () => {
      analyticsEngine.incRequest();
      expect(analyticsEngine['activeSessions']).toBe(1);
    });

    it('increments total requests', () => {
      analyticsEngine.incRequest();
      expect(analyticsEngine['totalRequests']).toBe(1);
    });

    it('increments requests in last minute', () => {
      analyticsEngine.incRequest();
      expect(analyticsEngine['requestsInLastMinute']).toBe(1);
    });

    it('resets requests counter after 1 minute', () => {
      analyticsEngine.incRequest();
      analyticsEngine['lastMinuteReset'] = Date.now() - 70000;
      analyticsEngine.incRequest();
      expect(analyticsEngine['requestsInLastMinute']).toBe(1);
    });

    it('handles multiple consecutive requests', () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      expect(analyticsEngine['activeSessions']).toBe(3);
      expect(analyticsEngine['totalRequests']).toBe(3);
      expect(analyticsEngine['requestsInLastMinute']).toBe(3);
    });
  });

  describe('decRequest', () => {
    it('decrements active sessions', () => {
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();
      expect(analyticsEngine['activeSessions']).toBe(0);
    });

    it('does not go below zero', () => {
      analyticsEngine.decRequest();
      expect(analyticsEngine['activeSessions']).toBe(0);
    });

    it('handles multiple decrements', () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();
      analyticsEngine.decRequest();
      expect(analyticsEngine['activeSessions']).toBe(0);
    });
  });

  describe('recordResponseTime', () => {
    it('records response time', () => {
      analyticsEngine.recordResponseTime(100);
      expect(analyticsEngine['responseTimes']).toContain(100);
    });

    it('records multiple response times', () => {
      analyticsEngine.recordResponseTime(100);
      analyticsEngine.recordResponseTime(200);
      analyticsEngine.recordResponseTime(150);
      expect(analyticsEngine['responseTimes']).toHaveLength(3);
      expect(analyticsEngine['responseTimes']).toEqual([100, 200, 150]);
    });

    it('limits response times to 1000 entries', () => {
      for (let i = 0; i < 1001; i++) {
        analyticsEngine.recordResponseTime(i);
      }
      expect(analyticsEngine['responseTimes']).toHaveLength(1000);
    });
  });

  describe('incError', () => {
    it('increments error count', () => {
      analyticsEngine.incError();
      expect(analyticsEngine['errorCount']).toBe(1);
    });

    it('handles multiple error increments', () => {
      analyticsEngine.incError();
      analyticsEngine.incError();
      analyticsEngine.incError();
      expect(analyticsEngine['errorCount']).toBe(3);
    });
  });
});
