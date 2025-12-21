import { NextRequest } from 'next/server';

/** Notification type definition */
interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

/** Dummy metrics placeholder */
function captureMetrics() {
  return {
    cpuUsage: Math.floor(Math.random() * 100),
    memoryUsage: Math.floor(Math.random() * 100),
  };
}

/** Generate notification objects based on current system state */
function generateNotifications(): Notification[] {
  const notifications: Notification[] = [];

  // Check system metrics for alerts
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

  // Add generic system status notification
  notifications.push({
    id: `status-${Date.now()}`,
    type: 'info',
    title: 'System Status',
    message: 'All systems operational.',
    timestamp: new Date().toISOString(),
    read: true,
  });

  // Sort by timestamp (newest first) and keep only latest 10
  return notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

/**
 * SSE endpoint for notifications
 */
export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const payload = {
            type: 'notifications',
            data: generateNotifications(),
            timestamp: new Date().toISOString(), // ISO timestamp as required
          };
          const chunk = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(chunk);
        } catch (err) {
          console.error('Error while generating notifications payload:', err);
          controller.close(); // Ensure stream is closed on error
          throw err; // Propagate error to be caught below
        }
      };

      // Send initial payload
      await sendUpdate();

      // Schedule updates every ~15 seconds with jitter
      let timeoutId: NodeJS.Timeout;
      const scheduleNext = () => {
        const baseDelay = 15000;
        const jitter = Math.random() * 3000;
        const delay = Math.floor(baseDelay + jitter);
        timeoutId = setTimeout(async () => {
          try {
            await sendUpdate();
            scheduleNext(); // reschedule after successful send
          } catch (err) {
            console.error('Error during scheduled notification update:', err);
            scheduleNext(); // try again
          }
        }, delay);
      };
      scheduleNext();

      // Cleanup function to stop timeout and close stream
      const cleanup = () => {
        clearTimeout(timeoutId);
        controller.close();
      };

      // Handle client abort to stop streaming gracefully
      const abortHandler = () => {
        cleanup();
      };
      request.signal.addEventListener('abort', abortHandler, { once: true });

      // Ensure cleanup runs even if an error occurs
      try {
        // Keep the stream alive; scheduleNext will keep sending updates
      } finally {
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}