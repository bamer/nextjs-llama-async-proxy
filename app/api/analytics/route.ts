import { NextRequest, NextResponse } from 'next/server';
import { ServerSentEventStream } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  // Wrap the request/response to track timing
  const { incRequest, decRequest, recordResponseTime } = await import('@/lib/analytics');
  
  incRequest();
  
  const startTime = process.hrtime.bigint();
  
  try {
    // Create SSE stream that sends analytics updates
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = () => {
          const analyticsData = ServerSentEventStream.getAnalytics();
          const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
          recordResponseTime(elapsedMs);
          
          const event = {
            type: 'analytics',
            data: analyticsData,
            timestamp: Date.now()
          };
          
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        };
        
        // Send initial update
        sendUpdate();
        
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
    decRequest();
  }
}