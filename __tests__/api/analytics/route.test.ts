import { NextRequest, NextResponse } from 'next/server';
import { ServerSentEventStream } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  incRequest: jest.fn(),
  decRequest: jest.fn(),
  recordResponseTime: jest.fn(),
  ServerSentEventStream: {
    startStream: jest.fn(),
  },
}));

describe('GET /api/analytics (SSE)', () => {
  const mockRequest = {
    headers: new Headers(),
    signal: new AbortSignal(),
    method: 'GET',
    url: '/api/analytics',
  };

  const mockResponse = {
    status: 200,
    headers: new Headers(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 with correct SSE headers', async () => {
    // Mock the stream to close immediately
    (ServerSentEventStream.startStream as jest.Mock).mockImplementation(() => {
      return new ReadableStream({
        async start(controller) {
          controller.close();
        },
      });
    });

    // Mock the dynamic import
    const analyticsMod = await import('@/lib/analytics');
    analyticsMod.incRequest.mockReturnValueOnce();
    analyticsMod.decRequest.mockReturnValueOnce();
    analyticsMod.recordResponseTime.mockReturnValueOnce();

    // Call the handler
    const response = await (await import('@/app/api/analytics/route')).GET(
      mockRequest as any,
      mockResponse as any
    );

    // Assertions
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(response.headers.get('connection')).toBe('keep-alive');

    // Verify that tracking functions were called
    expect(analyticsMod.incRequest).toHaveBeenCalled();
    expect(analyticsMod.decRequest).toHaveBeenCalled();
    expect(analyticsMod.recordResponseTime).toHaveBeenCalled();
  });
});