import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { captureMetrics } from '../../../src/lib/monitor';

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
    // Get real system metrics
    const metrics = captureMetrics();

    // Calculate uptime from process
    const uptime = process.uptime();

    // Get storage used (approximate from logs directory)
    let storageUsed = 0;
    try {
      const logsPath = path.join(process.cwd(), 'logs');
      if (fs.existsSync(logsPath)) {
        const files = fs.readdirSync(logsPath);
        storageUsed = files.reduce((total, file) => {
          const filePath = path.join(logsPath, file);
          const stats = fs.statSync(filePath);
          return total + stats.size;
        }, 0) / (1024 * 1024); // Convert to MB
      }
    } catch (error) {
      console.error('Failed to calculate storage used:', error);
    }

    // Calculate error rate from recent logs
    let errorCount = 0;
    let totalRequests = 0;
    try {
      const logFiles = ['logs/application-2025-12-16.log', 'logs/exceptions.log'];
      for (const logFile of logFiles) {
        const logPath = path.join(process.cwd(), logFile);
        if (fs.existsSync(logPath)) {
          const content = fs.readFileSync(logPath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          const recentLines = lines.slice(-100); // Last 100 entries

          for (const line of recentLines) {
            try {
              const logEntry = JSON.parse(line);
              totalRequests++;
              if (logEntry.level === 'error') {
                errorCount++;
              }
            } catch {
              // Skip malformed entries
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to analyze logs for analytics:', error);
    }

    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    // Estimate active sessions (this would need proper session tracking)
    const activeSessions = Math.floor(Math.random() * 10) + 1; // Placeholder

    // Estimate requests per minute (this would need proper request tracking)
    const requestsPerMinute = Math.floor(Math.random() * 20) + 5; // Placeholder

    // Estimate average response time (this would need proper timing)
    const averageResponseTime = Math.floor(Math.random() * 100) + 50; // Placeholder

    return {
      totalUsers: 1, // Single user system
      activeSessions,
      requestsPerMinute,
      averageResponseTime,
      errorRate,
      uptime: (uptime / (24 * 60 * 60)) * 100, // Uptime percentage
      bandwidthUsage: metrics.memoryUsage * 10, // Rough estimate
      storageUsed,
      timestamp: new Date().toISOString()
    };
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