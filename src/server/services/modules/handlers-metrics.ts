import type { Socket } from "socket.io";
import type { SystemMetrics } from "@/types/monitoring";

export function setupMetricsHandlers(
  socket: Socket,
  { collectMetrics }: { collectMetrics: () => Promise<SystemMetrics> }
): void {
  const handleRequestMetrics = async () => {
    const metrics = await collectMetrics();
    socket.emit("metrics", { type: "metrics", data: metrics, timestamp: Date.now() });
  };

  socket.on("requestMetrics", handleRequestMetrics);
  socket.on("request_metrics", handleRequestMetrics);
}
