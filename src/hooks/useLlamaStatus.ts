import { useEffect, useState, useCallback } from "react";
import { websocketServer } from "@/lib/websocket-client";
import type { LlamaStatus, LlamaStatusEvent } from "@/types/llama";

const INITIAL_STATE: LlamaStatus = {
  status: "initial",
  models: [],
  lastError: null,
  retries: 0,
  uptime: 0,
  startedAt: null,
};

export function useLlamaStatus(): LlamaStatus & { isLoading: boolean } {
  const [state, setState] = useState<LlamaStatus>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Handle incoming Llama status updates
  const handleLlamaStatus = useCallback((data: any) => {
    if (data && data.data) {
      setState({
        status: data.data.status,
        models: data.data.models || [],
        lastError: data.data.lastError,
        retries: data.data.retries || 0,
        uptime: data.data.uptime || 0,
        startedAt: data.data.startedAt || null,
      });
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen for Llama status events via the message bus
    const handleMessage = (message: any) => {
      if (message.type === "llama_status") {
        handleLlamaStatus(message);
      }
    };

    websocketServer.on("message", handleMessage);

    // Also listen directly for llamaStatus event from socket
    const socket = websocketServer.getSocket();
    if (socket) {
      socket.on("llamaStatus", (data: any) => {
        handleLlamaStatus(data);
      });
    }

    // Request initial status
    websocketServer.sendMessage("requestLlamaStatus");

    return () => {
      websocketServer.off("message", handleMessage);
    };
  }, [handleLlamaStatus]);

  return { ...state, isLoading };
}
