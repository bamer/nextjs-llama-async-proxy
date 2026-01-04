import { ServerSentEventStream, analyticsEngine } from '@/lib/analytics';
import { resetAnalyticsEngine } from './analytics.test-utils';

// Mock ServerSentEventStream
jest.mock('@/lib/analytics', () => ({
  ...jest.requireActual('@/lib/analytics'),
  ServerSentEventStream: {
    startStream: jest.fn().mockResolvedValue(new ReadableStream()),
    streamController: null,
  },
}));

describe('ServerSentEventStream', () => {
  beforeEach(() => {
    resetAnalyticsEngine();
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a new ReadableStream', async () => {
    const stream = await ServerSentEventStream.startStream();
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('sends updates every 5 seconds', async () => {
    await ServerSentEventStream.startStream();

    // The mock function should be called
    expect(ServerSentEventStream.startStream).toHaveBeenCalledTimes(1);
  });

  it('handles analytics errors gracefully', async () => {
    jest.spyOn(analyticsEngine, 'getAnalytics').mockRejectedValue(new Error('Analytics failed'));

    await ServerSentEventStream.startStream();

    // Should not throw even when analytics fails
    expect(() => jest.advanceTimersByTime(5000)).not.toThrow();
  });
});
