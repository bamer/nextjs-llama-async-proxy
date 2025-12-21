'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (event: string, data?: any) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(url: string = '/api/websocket'): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) return;

    const newSocket = io(url);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    newSocket.on('status', (data) => {
      setLastMessage({ type: 'status', data, timestamp: Date.now() });
    });

    newSocket.on('metrics', (data) => {
      setLastMessage({ type: 'metrics', data, timestamp: Date.now() });
    });

    newSocket.on('logs', (data) => {
      setLastMessage({ type: 'logs', data, timestamp: Date.now() });
    });

    // Listen for any message
    newSocket.onAny((event, data) => {
      setLastMessage({ type: event, data, timestamp: Date.now() });
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  };

  const sendMessage = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}