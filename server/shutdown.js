import { cleanupMetrics } from "./metrics.js";

/**
 * Setup graceful shutdown handlers for SIGTERM and SIGINT signals.
 * Cleans up metrics collection and closes server gracefully.
 * @param {Object} server - HTTP server instance
 */
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