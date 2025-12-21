import { NextRequest } from 'next/server';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

/** Simulated metrics */
function captureMetrics() {
  return {
    cpuUsage: Math.floor(Math.random() * 100),
    memoryUsage: Math.floor(Math.random() * 100),
  };
}

/** Generate notification objects */
function generateNotifications(): Notification[] {
  const notifications: Notification[] = [];

  const metrics = captureMetrics();
  if (metrics.cpuUsage > 80) {
    notifications.push({
      id: `cpu-${Date.now()}`,
      type: 'warning',
      title: 'High CPU Usage',
      message: `CPU usage is at ${metrics.cpuUsage}%. Consider optimizing processes.`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }
  if (metrics.memoryUsage > 85) {
    notifications.push({
      id: `mem-${Date.now()}`,
      type: 'warning',
      title: 'High Memory Usage',
      message: `Memory usage is at ${metrics.memoryUsage}%. Consider freeing up resources.`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  // Generic status
  notifications.push({
    id: `status-${Date.now()}`,
    type: 'info',
    title: 'System Status',
    message: 'All systems operational.',
    timestamp: new Date().toISOString(),
    read: true,
  });

  // Sort newest first and limit
  return notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

/**
 * SSE endpoint for notifications
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  let timeoutId: any; // Use any to avoid TypeScript conflict with NodeJS.Timeout

  return new Response(new ReadableStream({
    async start(controller) {
      let aborted = false;

      /** Send a single update */
      const sendUpdate = async () => {
        if (aborted) return;
        try {
          const payload = {
            type: 'notifications',
            data: generateNotifications(),
            timestamp: new Date().toISOString(),
          };
          const chunk = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch (err) {
          console.error('Error generating SSE payload:', err);
        }
      };

      /** Cleanup resources */
      const cleanup = () => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        controller.close();
      };

      /** Schedule next payload with jitter (± up to 2 seconds) */
      const scheduleNext = () => {
        if (aborted) return;
        const jitter = (Math.random() * 4 - 2) * 1000; // -2000 to +2000 ms
        timeoutId = setTimeout(() => {
          sendUpdate().catch((e) => console.error('Error in scheduled update:', e));
          scheduleNext(); // schedule subsequent update
        }, 15000 + jitter);
      };

      // Initial payload
      sendUpdate();

      // Schedule periodic updates with jitter
      scheduleNext();

      // Handle client disconnect
      const abortHandler = () => {
        aborted = true;
        cleanup();
      };
      request.signal.addEventListener('abort', abortHandler, { once: true });

      // Global error handling for the stream
      try {
        // Stream runs via scheduled sendUpdate calls
      } catch (err) {
        console.error('Unexpected error in SSE stream:', err);
      } finally {
        cleanup();
      }
    },
  }), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}