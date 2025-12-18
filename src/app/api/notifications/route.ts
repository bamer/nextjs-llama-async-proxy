import { NextRequest } from 'next/server';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [
      {
        id: '1',
        type: 'info',
        title: 'System Update',
        message: 'The system has been updated successfully.',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'warning',
        title: 'High CPU Usage',
        message: 'CPU usage is above 80%. Consider optimizing processes.',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'error',
        title: 'Connection Failed',
        message: 'Failed to connect to external service.',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: true
      },
      {
        id: '4',
        type: 'success',
        title: 'Backup Completed',
        message: 'Daily backup has been completed successfully.',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true
      }
    ];

    // Simulate new notifications occasionally
    if (Math.random() > 0.8) {
      notifications.unshift({
        id: Date.now().toString(),
        type: 'info',
        title: 'New User Connected',
        message: 'A new user has joined the system.',
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    return notifications.slice(0, 10); // Keep only latest 10
  };

  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = () => {
        const data = {
          type: 'notifications',
          data: generateNotifications(),
          timestamp: Date.now()
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial data
      sendUpdate();

      // Send updates every 15 seconds
      const interval = setInterval(sendUpdate, 15000);

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