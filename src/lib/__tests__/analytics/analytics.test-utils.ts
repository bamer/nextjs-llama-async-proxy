import { analyticsEngine, ServerSentEventStream } from '@/lib/analytics';
import { captureMetrics } from '@/lib/monitor';
import { promises as fs } from 'fs';
import { join } from 'path';

jest.mock('@/lib/monitor');
jest.mock('fs');
jest.mock('path');

export const mockedCaptureMetrics = captureMetrics as jest.MockedFunction<typeof captureMetrics>;
export const mockedFs = fs as jest.Mocked<typeof fs>;
export const mockedJoin = join as jest.MockedFunction<typeof join>;

export const resetAnalyticsEngine = () => {
  jest.clearAllMocks();
  analyticsEngine['activeSessions'] = 0;
  analyticsEngine['requestsInLastMinute'] = 0;
  analyticsEngine['lastMinuteReset'] = Date.now();
  analyticsEngine['errorCount'] = 0;
  analyticsEngine['totalRequests'] = 0;
  analyticsEngine['responseTimes'] = [];

  mockedCaptureMetrics.mockReturnValue({
    cpuUsage: 45,
    memoryUsage: 60,
    uptimeSeconds: 3600,
    timestamp: new Date().toISOString(),
  });
};
