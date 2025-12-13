'use client';

import { useEffect, useRef, useState, createContext, useContext, ReactNode } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const pollServer = async () => {
    try {
      const response = await fetch('/api/websocket?action=status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setConnectionStatus('connected');
        setLastMessage({
          type: 'status',
          data,
          timestamp: Date.now()
        });
        reconnectAttempts.current = 0;
      } else {
        // Don't treat 404 as critical error, just mark as disconnected
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      // Network errors are expected in development
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const startPolling = () => {
    setConnectionStatus('connecting');
    pollServer(); // Initial poll

    pollIntervalRef.current = setInterval(pollServer, 30000); // Poll every 30 seconds
  };

  const sendMessage = async (message: any) => {
    try {
      const response = await fetch('/api/websocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        const result = await response.json();
        setLastMessage({
          type: 'response',
          data: result,
          timestamp: Date.now()
        });
      } else {
        console.error('Failed to send message:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    startPolling();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
    connectionStatus,
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