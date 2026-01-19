/**
 * GPU Socket.IO Handlers
 * Stable Socket.IO contracts for GPU monitoring
 */

export function registerGpuHandlers(socket) {
  socket.on("gpu:status", async (req, callback) => {
    const { getGpuStatus } = await import("../services/gpu-monitor.js");
    const status = getGpuStatus();

    const response = {
      success: true,
      data: status.data,
      timestamp: new Date().toISOString(),
    };

    socket.emit("gpu:status:result", response);

    if (callback) callback(response);
  });

  socket.on("gpu:detect", async (req, callback) => {
    const { runDetectionAndBroadcast } = await import("../services/gpu-monitor.js");
    const gpus = await runDetectionAndBroadcast(socket.io);

    const response = {
      success: true,
      data: { count: gpus.length, gpus },
      timestamp: new Date().toISOString(),
    };

    socket.emit("gpu:detect:result", response);

    if (callback) callback(response);
  });
}
