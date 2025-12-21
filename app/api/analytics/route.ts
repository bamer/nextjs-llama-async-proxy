import { NextRequest } from 'next/server';
import { analyticsEngine } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  analyticsEngine.incRequest();

  const startTime = process.hrtime.bigint();

  try {
    // Create SSE stream that sends analytics updates
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = async () => {
          const analyticsData = await analyticsEngine.getAnalytics();
          const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
          analyticsEngine.recordResponseTime(elapsedMs);

          const event = {
            type: 'analytics',
            data: analyticsData,
            timestamp: Date.now()
          };

          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        };

        // Send initial update
        await sendUpdate();

        // Send updates every 5 seconds
        const interval = setInterval(sendUpdate, 5000);

        // Cleanup on client disconnect
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
        Connection: 'keep-alive',
      },
    });
  } finally {
    analyticsEngine.decRequest();
  }
}