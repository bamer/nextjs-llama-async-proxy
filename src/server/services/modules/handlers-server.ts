import type { Socket } from "socket.io";
import type { WebSocketHandlersDependencies } from "../server.types";
import { getLogger } from "../../../lib/logger";

const logger = getLogger();

export function setupServerControlHandlers(
  socket: Socket,
  { llamaService }: WebSocketHandlersDependencies
): void {
  const handleRestartServer = async () => {
    try {
      await llamaService?.stop();
      await llamaService?.start();
      socket.emit("serverRestarted", { message: "Server restarted successfully" });
    } catch (error) {
      socket.emit("error", { message: "Failed to restart server" });
    }
  };

  const handleStartLlamaServer = async () => {
    try {
      if (!llamaService) {
        socket.emit("error", { message: "Llama service not available" });
        return;
      }
      await llamaService.start();
      socket.emit("serverStarted", { message: "Server started successfully" });
    } catch (error) {
      socket.emit("error", { message: "Failed to start server" });
    }
  };

  const handleRequestLlamaStatus = async () => {
    if (!llamaService) return;

    const state = llamaService.getState();
    socket.emit("llamaStatus", {
      type: "status",
      data: {
        status: state.status,
        lastError: state.lastError,
        uptime: state.uptime || 0,
        startedAt: state.startedAt ? state.startedAt.toISOString() : null,
      },
      timestamp: Date.now(),
    });
  };

  socket.on("restart_server", handleRestartServer);
  socket.on("restartServer", handleRestartServer);
  socket.on("start_llama_server", handleStartLlamaServer);
  socket.on("startLlamaServer", handleStartLlamaServer);
  socket.on("requestLlamaStatus", handleRequestLlamaStatus);
}
