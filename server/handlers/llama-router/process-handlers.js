/**
 * llama-server process control handlers
 */

import { ok, err } from "../response.js";

export function registerProcessHandlers(socket, io, db, processManager) {
  /**
   * Start llama-server
   */
  socket.on("llama-server:start", async (req) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] llama-server:start request:", { requestId: id });
    try {
      const config = db.getConfig();
      await processManager.start();
      ok(
        socket,
        "llama-server:start:result",
        {
          pid: processManager.pid,
          message: "llama-server started successfully",
        },
        id
      );

      // Broadcast to all clients
      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "running",
          pid: processManager.pid,
          uptime: 0,
          metrics: processManager.metrics,
        },
      });

      // Log to database
      db.addLogs("info", "llama-server started", "llama-router");
    } catch (e) {
      console.error("[DEBUG] llama-server:start error:", e);
      err(socket, "llama-server:start:result", e.message, id);
    }
  });

  /**
   * Stop llama-server
   */
  socket.on("llama-server:stop", async (req) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] llama-server:stop request:", { requestId: id });
    try {
      await processManager.stop();
      ok(
        socket,
        "llama-server:stop:result",
        {
          message: "llama-server stopped successfully",
        },
        id
      );

      // Broadcast to all clients
      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "stopped",
          pid: null,
          uptime: 0,
          metrics: null,
        },
      });

      // Log to database
      db.addLogs("info", "llama-server stopped", "llama-router");
    } catch (e) {
      console.error("[DEBUG] llama-server:stop error:", e);
      err(socket, "llama-server:stop:result", e.message, id);
    }
  });

  /**
   * Get llama-server status
   */
  socket.on("llama-server:status", async (req) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] llama-server:status request:", { requestId: id });
    try {
      const status = processManager.getStatus();
      ok(socket, "llama-server:status:result", status, id);
    } catch (e) {
      console.error("[DEBUG] llama-server:status error:", e);
      err(socket, "llama-server:status:result", e.message, id);
    }
  });
}
