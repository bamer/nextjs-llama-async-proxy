import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { captureMetrics } from '@/lib/monitor';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Log files to monitor
const LOG_FILES = [
  'logs/application-2025-12-16.log', // Today's log
  'logs/exceptions.log',
  'logs/rejections.log'
];

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];

    // Check system metrics for alerts
    try {
      const metrics = captureMetrics();
      if (metrics.cpuUsage > 80) {
        notifications.push({
          id: `cpu-${Date.now()}`,
          type: 'warning',
          title: 'High CPU Usage',
          message: `CPU usage is at ${metrics.cpuUsage}%. Consider optimizing processes.`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
      if (metrics.memoryUsage > 85) {
        notifications.push({
          id: `mem-${Date.now()}`,
          type: 'warning',
          title: 'High Memory Usage',
          message: `Memory usage is at ${metrics.memoryUsage}%. Consider freeing up resources.`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to capture metrics for notifications:', error);
    }

    // Check log files for recent errors/warnings
    for (const logFile of LOG_FILES) {
      try {
        const logPath = path.join(process.cwd(), logFile);
        if (fs.existsSync(logPath)) {
          const content = fs.readFileSync(logPath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());

          // Get last 10 lines
          const recentLines = lines.slice(-10);

          for (const line of recentLines) {
            try {
              const logEntry = JSON.parse(line);
              if (logEntry.level === 'error') {
                notifications.push({
                  id: `error-${Date.now()}-${Math.random()}`,
                  type: 'error',
                  title: 'Application Error',
                  message: logEntry.message || 'An error occurred in the application.',
                  timestamp: logEntry.timestamp || new Date().toISOString(),
                  read: false
                });
              } else if (logEntry.level === 'warn') {
                notifications.push({
                  id: `warn-${Date.now()}-${Math.random()}`,
                  type: 'warning',
                  title: 'Application Warning',
                  message: logEntry.message || 'A warning occurred in the application.',
                  timestamp: logEntry.timestamp || new Date().toISOString(),
                  read: false
                });
              }
            } catch (parseError) {
              // Skip malformed log entries
            }
          }
        }
      } catch (error) {
        console.error(`Failed to read log file ${logFile}:`, error);
      }
    }

    // Add some system status notifications
    notifications.push({
      id: `status-${Date.now()}`,
      type: 'info',
      title: 'System Status',
      message: 'All systems operational.',
      timestamp: new Date().toISOString(),
      read: true
    });

    // Sort by timestamp (newest first) and keep only latest 10
    return notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
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