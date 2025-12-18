import { NextRequest } from 'next/server';

interface AnalyticsData {
  totalUsers: number;
  activeSessions: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  bandwidthUsage: number;
  storageUsed: number;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const generateAnalytics = (): AnalyticsData => {
    const baseData = {
      totalUsers: 1250,
      activeSessions: Math.floor(Math.random() * 50) + 20,
      requestsPerMinute: Math.floor(Math.random() * 100) + 50,
      averageResponseTime: Math.floor(Math.random() * 200) + 100,
      errorRate: Math.random() * 0.05,
      uptime: 99.9 + Math.random() * 0.1,
      bandwidthUsage: Math.floor(Math.random() * 100) + 200,
      storageUsed: 75 + Math.random() * 10,
      timestamp: new Date().toISOString()
    };

    // Simulate trends
    baseData.totalUsers += Math.floor(Math.random() * 10) - 5;
    baseData.requestsPerMinute += Math.floor(Math.random() * 20) - 10;

    return baseData;
  };

  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = () => {
        const data = {
          type: 'analytics',
          data: generateAnalytics(),
          timestamp: Date.now()
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial data
      sendUpdate();

      // Send updates every 5 seconds
      const interval = setInterval(sendUpdate, 5000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}