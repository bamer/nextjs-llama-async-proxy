import { cleanupMetrics } from "./metrics.js";

// Graceful shutdown
export function setupGracefulShutdown(server) {
  const shutdown = (sig) => {
    console.log(`\n${sig} received, shutting down...`);
    
    // Cleanup metrics collection
    cleanupMetrics();
    
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forced shutdown");
      process.exit(1);
    }, 10000);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}