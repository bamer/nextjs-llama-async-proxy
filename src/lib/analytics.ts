import { captureMetrics } from '@/lib/monitor';
import { ServerSentEventStream } from './sse-stream';

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
  private requestTimestamps: number[] = [];
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
  public getAnalytics(): AnalyticsData {
    const now = Date.now();
    const avgResponse = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    // Approximate storage used from logs directory
    let storageUsed = 0;
    try {
      const logsPath = require('path').join(process.cwd(), 'logs');
      if (require('fs').existsSync(logsPath)) {
        const files = require('fs').readdirSync(logsPath);
        storageUsed = files.reduce((total: number, file: string) => {
          const stats = require('fs').statSync(require('path').join(logsPath, file));
          return total + stats.size;
        }, 0) / (1024 * 1024); // Convert to MB
      }
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
  private static stream: ReadableStream<ReadableStreamDefaultController<stringAndChunks>> | null = null;

  /** Start the SSE stream */
  public static startStream() {
    if (this.stream) {
      this.stream.cancel();
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        this.stream = controller.stream;
        // Send initial analytics update
        const sendUpdate = async () => {
          try {
            const analytics = analyticsEngine.getAnalytics();
            const data = {
              type: 'analytics',
              data: analytics,
              timestamp: Date.now()
            };
            controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
          } catch (error) {
            console.error('Error sending analytics update:', error);
          }
        };
        await sendUpdate();

        // Send updates every 5 seconds
        const interval = setInterval(async () => {
          try {
            const analytics = analyticsEngine.getAnalytics();
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

        // Cleanup on client disconnect
        const abortController = new AbortController();
        // @ts-ignore - request is available in certain contexts
        if (self?.request?.signal) {
          self.request.signal.addEventListener('abort', () => {
            clearInterval(interval);
            controller.close();
          });
        }
      }
    });

    return stream;
  }

  /** Get the current stream */
  public static getStream() {
    return this.stream;
  }
}