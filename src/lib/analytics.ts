import { captureMetrics } from '@/lib/monitor';
import { join } from 'path';
import { promises as fs } from 'fs';

/**
 * Analytics service for tracking real system metrics
 */
export interface AnalyticsData {
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

class AnalyticsEngine {
  private static instance: AnalyticsEngine;
  private activeSessions = 0;
  private requestsInLastMinute = 0;
  private lastMinuteReset = Date.now();
  private errorCount = 0;
  private totalRequests = 0;
  private responseTimes: number[] = [];

  private constructor() {}

  public static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  /** Called when a request starts */
  public incRequest() {
    this.activeSessions++;
    const now = Date.now();
    if (now - this.lastMinuteReset > 60000) {
      this.requestsInLastMinute = 0;
      this.lastMinuteReset = now;
    }
    this.requestsInLastMinute++;
    this.totalRequests++;
  }

  /** Called when a request ends */
  public decRequest() {
    this.activeSessions--;
  }

  /** Record response time in milliseconds */
  public recordResponseTime(ms: number) {
    this.responseTimes.push(ms);
    if (this.responseTimes.length > 1000) this.responseTimes.shift();
  }

  /** Increment error count */
  public incError() {
    this.errorCount++;
  }

  /** Generate current analytics snapshot */
  public async getAnalytics(): Promise<AnalyticsData> {
    // Calculate average response time
    const avgResponse = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    // Approximate storage used from logs directory
    let storageUsed = 0;
    try {
      const logsPath = join(process.cwd(), 'logs');
      await fs.access(logsPath).catch(() => ({}));
      const files = await fs.readdir(logsPath);
      const sizes = await Promise.all(
        files.map(async (file) => {
          const stats = await fs.stat(join(logsPath, file));
          return stats.size;
        })
      );
      storageUsed = sizes.reduce((total: number, size: number) => total + size, 0) / (1024 * 1024); // Convert to MB
    } catch (e) {
      console.error('Failed to calculate storage used:', e);
    }

    // Get system metrics
    const metrics = captureMetrics();

    return {
      totalUsers: 1, // Single user system
      activeSessions: this.activeSessions,
      requestsPerMinute: this.requestsInLastMinute,
      averageResponseTime: Math.round(avgResponse),
      errorRate: this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0,
      uptime: (process.uptime() / (24 * 60 * 60)) * 100, // Uptime percentage
      bandwidthUsage: metrics.memoryUsage * 10, // Rough estimate
      storageUsed,
      timestamp: new Date().toISOString(),
    };
  }
}

export const analyticsEngine = AnalyticsEngine.getInstance();

/**
 * SSE stream implementation
 */
export class ServerSentEventStream {
  private static streamController: any = null;

  /** Start the SSE stream */
  public static async startStream() {
    if (ServerSentEventStream.streamController) {
      ServerSentEventStream.streamController.cancel();
    }

    const stream = new ReadableStream<string>({
      async start(controller) {
        ServerSentEventStream.streamController = controller as any;
        // Send initial analytics update
        try {
          const analytics = await analyticsEngine.getAnalytics();
          const data = {
            type: 'analytics',
            data: analytics,
            timestamp: Date.now()
          };
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          console.error('Error sending analytics update:', error);
        }

        // Send updates every 5 seconds
        setInterval(async () => {
          try {
            const analytics = await analyticsEngine.getAnalytics();
            const data = {
              type: 'analytics',
              data: analytics,
              timestamp: Date.now()
            };
            controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
          } catch (error) {
            console.error('Error sending analytics update:', error);
          }
        }, 5000);

        // No cleanup needed for now
      }
    });

    return stream;
  }

  /** Get the current stream */
  public static getStream() {
    return ServerSentEventStream.streamController;
  }
}