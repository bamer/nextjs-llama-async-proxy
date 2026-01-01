import type { Socket } from "socket.io";
import { getWebSocketTransport } from "../../../lib/logger";

export function setupLogsHandlers(socket: Socket): void {
  const handleRequestLogs = () => {
    try {
      const wsTransport = getWebSocketTransport();
      const cachedLogs = wsTransport?.getCachedLogs() || [];

      socket.emit("logs", {
        type: "logs",
        data: cachedLogs,
        timestamp: Date.now(),
      });
    } catch {
      socket.emit("logs", {
        type: "logs",
        data: [],
        timestamp: Date.now(),
      });
    }
  };

  socket.on("requestLogs", handleRequestLogs);
  socket.on("request_logs", handleRequestLogs);
  socket.on("download_logs", handleRequestLogs);
  socket.on("downloadLogs", handleRequestLogs);
}
