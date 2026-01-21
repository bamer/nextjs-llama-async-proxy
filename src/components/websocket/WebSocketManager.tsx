'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useWebSocket as useSocketHook } from '@/hooks/useWebSocket';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (event: string, data?: any) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  getMetrics: () => void;
  getLogs: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isConnected, lastMessage, sendMessage, connect, disconnect } = useSocketHook();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    connect();
    setConnectionStatus('connecting');

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  const getMetrics = () => {
    sendMessage('getMetrics');
  };

  const getLogs = () => {
    sendMessage('getLogs');
  };

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
    connectionStatus,
    getMetrics,
    getLogs,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Legacy component for backward compatibility
export function WebSocketManager() {
  return null; // Functionality moved to WebSocketProvider
}