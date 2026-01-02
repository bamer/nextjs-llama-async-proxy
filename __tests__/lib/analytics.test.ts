import { analyticsEngine, ServerSentEventStream, AnalyticsData } from '@/lib/analytics';

// Import mocks first, before scenario files
import { resetFsMocks } from './analytics-mocks';

// Import scenario functions
import { describeTrackingScenarios } from './analytics-tracking.scenarios';
import { describeAggregationScenarios } from './analytics-aggregation.scenarios';
import { describeReportScenarios } from './analytics-report.scenarios';

describe('analyticsEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetFsMocks();
    jest.useFakeTimers();
    // Reset private state by accessing instance methods
    analyticsEngine['activeSessions'] = 0;
    analyticsEngine['requestsInLastMinute'] = 0;
    analyticsEngine['totalRequests'] = 0;
    analyticsEngine['errorCount'] = 0;
    analyticsEngine['responseTimes'] = [];
    analyticsEngine['lastMinuteReset'] = Date.now();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = analyticsEngine;
      const instance2 = analyticsEngine;
      expect(instance1).toBe(instance2);
    });
  });

  // Include tracking scenarios
  describeTrackingScenarios();

  // Include aggregation scenarios
  describeAggregationScenarios();

  // Include report scenarios (edge cases and SSE)
  describeReportScenarios();
});
