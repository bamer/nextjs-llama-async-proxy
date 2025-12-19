// nextjs-llama-async-proxy/src/app/api/monitoring/route.ts
import { NextResponse } from 'next/server';
import { captureMetrics } from '@/lib/monitor';
import { ProcessManagerAPI } from '@/lib/process-manager';

interface MonitoringMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeModels: number;
  totalRequests: number;
  avgResponseTime: number;
  timestamp: string;
}

export async function GET() {
  try {
    // Get real system metrics
    const systemMetrics = captureMetrics();

    // Get active models count from ProcessManager
    const activeModels = Object.keys(ProcessManagerAPI.getInfo ? {} : {}).length;

    // Note: Could fetch total models from Ollama if needed for additional metrics

    // For totalRequests and avgResponseTime, we'd need to track these in the app
    // For now, use placeholder values or implement request tracking
    const monitoringMetrics: MonitoringMetrics = {
      cpuUsage: systemMetrics.cpuUsage,
      memoryUsage: systemMetrics.memoryUsage,
      activeModels,
      totalRequests: 0, // TODO: Implement request tracking
      avgResponseTime: 0, // TODO: Implement response time tracking
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(monitoringMetrics);
  } catch (error) {
    console.error('Error fetching monitoring data:', error);

    // Fallback: Return basic system metrics
    try {
      const systemMetrics = captureMetrics();
      const monitoringMetrics: MonitoringMetrics = {
        cpuUsage: systemMetrics.cpuUsage,
        memoryUsage: systemMetrics.memoryUsage,
        activeModels: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(monitoringMetrics);
    } catch (fallbackError) {
      console.error('Fallback monitoring failed:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to fetch monitoring data' },
        { status: 500 }
      );
    }
  }
}