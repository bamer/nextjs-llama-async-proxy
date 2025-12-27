import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { metricsResponseSchema, SystemMetrics } from "@/lib/validators";

const logger = getLogger();

/**
 * Generate mock system metrics
 * This can be replaced with real system monitoring integration later
 */
function generateMockMetrics(): SystemMetrics {
  const now = new Date().toISOString();

  // Generate realistic-looking mock data
  const cpuUsage = Math.floor(Math.random() * 40) + 20; // 20-60%
  const memoryUsage = Math.floor(Math.random() * 30) + 40; // 40-70%
  const diskUsage = Math.floor(Math.random() * 20) + 50; // 50-70%
  const activeModels = Math.floor(Math.random() * 3) + 1; // 1-3 models
  const totalRequests = Math.floor(Math.random() * 1000) + 5000; // 5000-6000 requests
  const avgResponseTime = Math.floor(Math.random() * 100) + 50; // 50-150ms
  const uptime = Math.floor(Math.random() * 86400) + 3600; // 1-25 hours in seconds

  // Optional GPU metrics (mock data)
  const hasGPU = Math.random() > 0.3; // 70% chance of having GPU data
  const gpuUsage = hasGPU ? Math.floor(Math.random() * 50) + 30 : undefined; // 30-80%
  const gpuMemoryUsage = hasGPU ? Math.floor(Math.random() * 40) + 40 : undefined; // 40-80%
  const gpuMemoryTotal = hasGPU ? 24 * 1024 * 1024 * 1024 : undefined; // 24GB
  const gpuMemoryUsed = hasGPU
    ? Math.floor((gpuMemoryUsage! / 100) * (24 * 1024 * 1024 * 1024))
    : undefined;
  const gpuPowerUsage = hasGPU ? Math.floor(Math.random() * 150) + 100 : undefined; // 100-250W
  const gpuPowerLimit = hasGPU ? 300 : undefined; // 300W limit
  const gpuTemperature = hasGPU ? Math.floor(Math.random() * 20) + 60 : undefined; // 60-80°C
  const gpuName = hasGPU ? "NVIDIA RTX 4090" : undefined;

  const metrics: SystemMetrics = {
    cpuUsage,
    memoryUsage,
    diskUsage,
    activeModels,
    totalRequests,
    avgResponseTime,
    uptime,
    timestamp: now,
    ...(gpuUsage !== undefined && { gpuUsage }),
    ...(gpuMemoryUsage !== undefined && { gpuMemoryUsage }),
    ...(gpuMemoryTotal !== undefined && { gpuMemoryTotal }),
    ...(gpuMemoryUsed !== undefined && { gpuMemoryUsed }),
    ...(gpuPowerUsage !== undefined && { gpuPowerUsage }),
    ...(gpuPowerLimit !== undefined && { gpuPowerLimit }),
    ...(gpuTemperature !== undefined && { gpuTemperature }),
    ...(gpuName !== undefined && { gpuName }),
  };

  return metrics;
}

/**
 * GET /api/metrics
 * Returns current system metrics
 */
export async function GET(): Promise<NextResponse> {
  try {
    logger.info("[API] Fetching system metrics");

    // Generate mock metrics (replace with real system monitoring later)
    const metrics = generateMockMetrics();

    // Validate metrics against schema
    const validationResult = metricsResponseSchema.safeParse({
      metrics,
      timestamp: new Date().toISOString(),
    });

    if (!validationResult.success) {
      logger.error("[API] Metrics validation failed:", validationResult.error);
      return NextResponse.json(
        {
          error: "Failed to validate metrics data",
          details: validationResult.error.issues,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    logger.info("[API] Metrics fetched successfully");
    return NextResponse.json(validationResult.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[API] Error fetching metrics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch metrics",
        details: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
