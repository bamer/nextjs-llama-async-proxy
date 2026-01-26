// Minimal Metrics Handlers (per-domain modular wiring)
export function registerMetricsHandlers(socket, io, db) {
  // Subscribe to metrics cadence
  socket.on("metrics:subscribe", (req, cb) => {
    // Placeholder: acknowledge subscription
    cb({ success: true, message: "Subscribed to metrics cadence" });
  });

  // Unsubscribe
  socket.on("metrics:unsubscribe", (req, cb) => {
    cb({ success: true, message: "Unsubscribed from metrics cadence" });
  });

  // Simple metrics get (for initial load or manual request)
  socket.on("metrics:get", (req, cb) => {
    const metrics = { cpu: 12, memory: 64, gpu: [] };
    cb({ success: true, data: { metrics } });
  });

  // Publish a sample metrics update to all other clients (no self)
  socket.on("metrics:publish", () => {
    const metrics = { cpu: Math.floor(Math.random() * 100), memory: 1024 * 1024 * 2 };
    if (io && typeof io.emit === "function") {
      io.emit("metrics:updated", { metrics });
    } else {
      socket.broadcast.emit("metrics:updated", { metrics });
    }
  });
}
