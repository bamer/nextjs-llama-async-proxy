/**
 * GPU Socket.IO Handlers
 * Stable Socket.IO contracts for GPU monitoring
 */

export function registerGpuHandlers(socket) {
  // gpu:status - Get current GPU status
  socket.on("gpu:status", async (req, callback) => {
    console.debug("[GPU-HANDLER] gpu:status request received");
    try {
      const { getGpuStatus } = await import("../services/gpu-monitor.js");
      const status = getGpuStatus();

      console.debug("[GPU-HANDLER] getGpuStatus returned:", {
        hasData: !!status.data,
        dataKeys: status.data ? Object.keys(status.data) : [],
        listLength: status.data?.list?.length || 0,
      });

      // status object structure: { type: "broadcast", timestamp, data: { list, count, usage, ... } }
      const gpuData = status.data || status;
      const response = {
        success: true,
        data: {
          list: gpuData.list || [],
          count: gpuData.count || 0,
          usage: gpuData.usage || 0,
          memoryUsed: gpuData.memoryUsed || 0,
          memoryTotal: gpuData.memoryTotal || 0,
          temperature: gpuData.temperature || 0,
          power: gpuData.power || 0,
        },
        timestamp: new Date().toISOString(),
      };

      console.debug("[GPU-HANDLER] Sending response with", response.data.list.length, "GPU(s)");
      if (callback) callback(response);
    } catch (error) {
      console.error("[GPU-HANDLER] gpu:status error:", error.message, error.stack);
      if (callback) {
        callback({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });

  // gpu:detect - Force GPU detection and broadcast
  socket.on("gpu:detect", async (req, callback) => {
    console.debug("[GPU-HANDLER] gpu:detect request");
    try {
      const { detectAndCollectGpus } = await import("../services/gpu-detector.js");
      const { buildBroadcastData } = await import("../services/gpu-monitor.js");

      const gpus = await detectAndCollectGpus();
      const broadcastData = buildBroadcastData(gpus);

      // Broadcast to all clients (exclude sender)
      socket.broadcast.emit("gpu:updated", broadcastData);

      const response = {
        success: true,
        data: {
          count: gpus.length,
          list: broadcastData.data?.list || gpus,
        },
        timestamp: new Date().toISOString(),
      };

      if (callback) callback(response);
      console.debug("[GPU-HANDLER] gpu:detect found", gpus.length, "GPU(s)");
    } catch (error) {
      console.error("[GPU-HANDLER] gpu:detect error:", error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });
}
