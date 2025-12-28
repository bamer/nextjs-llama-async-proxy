"use client";

import { useEffectEvent as ReactUseEffectEvent, useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useStore } from "@/lib/store";

export function useServerActions() {
  const { isConnected, sendMessage } = useWebSocket();

  const handleStartServer = ReactUseEffectEvent(() => {
    sendMessage('start_llama_server', {});
  });

  const handleStopServer = ReactUseEffectEvent(() => {
    sendMessage('stop_llama_server', {});
  });

  return {
    handleStartServer,
    handleStopServer,
    isConnected,
  };
}
