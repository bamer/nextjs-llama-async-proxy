import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { MonitoringEntry } from "@/types/monitoring";
import { LlamaService } from "@/server/services/LlamaService";

const logger = getLogger();

/**
 * GET /api/monitoring/latest
 * Returns latest monitoring data
 *
 * Response format matches MonitoringEntry type:
 * {
 *   system: {
 *     cpu: { usage: number },
 *     memory: { used: number },
 *     disk: { used: number },
 *     network: { rx: number, tx: number },
 *     uptime: number
 *   },
 *   models: Array<{
 *     status: string,
 *     memory: number,
 *     requests: number
 *   }>
 * }
 */
export async function GET(): Promise<NextResponse> {
  try {
    logger.info("[API] Fetching latest monitoring data");

    // Get service instance from registry
    const globalAny = global as unknown as { registry: any };
    const registry = globalAny.registry as {
      get: (name: string) => LlamaService | null;
    };

    const llamaService = registry?.get("llamaService");

    // Generate mock system metrics (similar to /api/metrics)
    const cpuUsage = Math.floor(Math.random() * 40) + 20; // 20-60%
    const memoryUsage = Math.floor(Math.random() * 30) + 40; // 40-70%
    const diskUsage = Math.floor(Math.random() * 20) + 50; // 50-70%
    const uptime = Math.floor(Math.random() * 86400) + 3600; // 1-25 hours in seconds
    const networkRx = Math.floor(Math.random() * 10000) + 1000; // 1-10 MB/s
    const networkTx = Math.floor(Math.random() * 5000) + 500; // 0.5-5 MB/s

    // Get models from llama service if available
    let models: Array<{ status: string; memory: number; requests: number }> = [];

    if (llamaService) {
      try {
        const state = llamaService.getState();
        models = state.models.map((model: any) => ({
          status: model.status || "idle",
          memory: model.size ? Math.round(model.size / (1024 * 1024)) : 0,
          requests: Math.floor(Math.random() * 100),
        }));
      } catch (error) {
        logger.warn("[API] Failed to get models from llama service:", error);
      }
    }

    // Build the monitoring entry
    const monitoringData: MonitoringEntry = {
      system: {
        cpu: {
          usage: cpuUsage,
        },
        memory: {
          used: memoryUsage,
        },
        disk: {
          used: diskUsage,
        },
        network: {
          rx: networkRx,
          tx: networkTx,
        },
        uptime: uptime,
      },
      models: models,
    };

    logger.info("[API] Monitoring data fetched successfully");
    return NextResponse.json(
      {
        success: true,
        data: monitoringData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[API] Error fetching monitoring data:", error);

    // Return error response with ApiResponse format
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MONITORING_FETCH_ERROR",
          message: "Failed to fetch monitoring data",
          details: message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
