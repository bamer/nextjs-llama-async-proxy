import { NextResponse } from "next/server";
import { getMetricsHistory } from "@/lib/database";

/**
 * GET /api/monitoring/history
 * Returns chart history data from database (last 10 minutes)
 * This ensures charts have data on cold launch and page refresh
 *
 * Response format:
 * {
 *   success: true,
 *   data: {
 *     cpu: [{ time, displayTime, value }],
 *     memory: [{ time, displayTime, value }],
 *     requests: [{ time, displayTime, value }],
 *     gpuUtil: [{ time, displayTime, value }],
 *     power: [{ time, displayTime, value }],
 *   },
 *   timestamp: string
 * }
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Get last 10 minutes of metrics history
    const history = getMetricsHistory(10);

    if (history.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: "No chart history available",
          timestamp: Date.now(),
        },
        { status: 200 }
      );
    }

    // Transform database format to chart format
    const chartData = {
      cpu: history.map((h) => ({
        time: new Date(h.timestamp * 1000).toISOString(),
        displayTime: new Date(h.timestamp * 1000).toLocaleTimeString(),
        value: h.cpu_usage,
      })),
      memory: history.map((h) => ({
        time: new Date(h.timestamp * 1000).toISOString(),
        displayTime: new Date(h.timestamp * 1000).toLocaleTimeString(),
        value: h.memory_usage,
      })),
      requests: history.map((h) => ({
        time: new Date(h.timestamp * 1000).toISOString(),
        displayTime: new Date(h.timestamp * 1000).toLocaleTimeString(),
        value: h.requests_per_minute || 0,
      })),
      gpuUtil: history.map((h) => ({
        time: new Date(h.timestamp * 1000).toISOString(),
        displayTime: new Date(h.timestamp * 1000).toLocaleTimeString(),
        value: h.gpu_usage || 0,
      })),
      power: history.map((h) => ({
        time: new Date(h.timestamp * 1000).toISOString(),
        displayTime: new Date(h.timestamp * 1000).toLocaleTimeString(),
        value: h.gpu_power_usage || 0,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: chartData,
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Error fetching chart history:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CHART_HISTORY_ERROR",
          message: "Failed to fetch chart history",
          details: message,
        },
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
