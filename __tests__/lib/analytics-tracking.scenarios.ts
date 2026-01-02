import { analyticsEngine } from '@/lib/analytics';

/**
 * Analytics tracking scenarios
 * Tests for tracking individual metrics: requests, response times, errors
 */

export function describeTrackingScenarios() {
  describe('incRequest', () => {
    it('increments active sessions and requests', () => {
      analyticsEngine.incRequest();
      analyticsEngine.incRequest();
      expect(analyticsEngine['activeSessions']).toBe(2);
      expect(analyticsEngine['totalRequests']).toBe(2);
    });

    it('resets requestsInLastMinute after 60 seconds', () => {
      analyticsEngine.incRequest();
      jest.advanceTimersByTime(61000);
      analyticsEngine.incRequest();
      expect(analyticsEngine['requestsInLastMinute']).toBe(1);
    });
  });

  describe('decRequest', () => {
    it('decrements active sessions', () => {
      analyticsEngine.incRequest();
      analyticsEngine.decRequest();
      expect(analyticsEngine['activeSessions']).toBe(0);
    });

    it('handles decrement without increment', () => {
      analyticsEngine.decRequest();
      expect(analyticsEngine['activeSessions']).toBe(-1);
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
      analyticsEngine.recordResponseTime(200);
      expect(analyticsEngine['responseTimes']).toEqual([100, 200]);
    });

    it('limits response times to 1000 entries', () => {
      const times = new Array(1001).fill(100);
      times.forEach((t) => analyticsEngine.recordResponseTime(t));
      expect(analyticsEngine['responseTimes'].length).toBe(1000);
    });

    it('handles zero response time', () => {
      analyticsEngine.recordResponseTime(0);
      expect(analyticsEngine['responseTimes']).toContain(0);
    });

    it('handles negative response time', () => {
      analyticsEngine.recordResponseTime(-100);
      expect(analyticsEngine['responseTimes']).toContain(-100);
    });

    it('handles very large response time', () => {
      analyticsEngine.recordResponseTime(999999999);
      expect(analyticsEngine['responseTimes']).toContain(999999999);
    });

    it('handles floating point response time', () => {
      analyticsEngine.recordResponseTime(123.456);
      expect(analyticsEngine['responseTimes']).toContain(123.456);
    });

    it('handles Infinity response time', () => {
      analyticsEngine.recordResponseTime(Infinity);
      expect(analyticsEngine['responseTimes']).toContain(Infinity);
    });

    it('handles -Infinity response time', () => {
      analyticsEngine.recordResponseTime(-Infinity);
      expect(analyticsEngine['responseTimes']).toContain(-Infinity);
    });
  });

  describe('incError', () => {
    it('increments error count', () => {
      analyticsEngine.incError();
      analyticsEngine.incError();
      expect(analyticsEngine['errorCount']).toBe(2);
    });

    it('handles multiple error increments', () => {
      for (let i = 0; i < 1000; i++) {
        analyticsEngine.incError();
      }
      expect(analyticsEngine['errorCount']).toBe(1000);
    });
  });
}
