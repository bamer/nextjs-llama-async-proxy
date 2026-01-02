// WebSocket message interfaces and types

export interface BaseMessage {
  type: string;
  data?: unknown;
}

export interface ConfigMessage extends BaseMessage {
  type: 'config_saved';
  success: boolean;
  error?: string;
  data?: unknown;
}

export type WebSocketMessage = BaseMessage | ConfigMessage;

// Type guard for config messages
export function isConfigMessage(msg: WebSocketMessage): msg is ConfigMessage {
  return msg.type === 'config_saved' && 'success' in msg;
}

export interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
  reconnectionAttempts: number;
  sendMessage: (event: string, data?: unknown) => void;
  requestMetrics: () => void;
  requestLogs: () => void;
  requestModels: () => void;
  startModel: (modelId: string) => void;
  stopModel: (modelId: string) => void;
  unloadModel: (modelId: string) => void;
  on: (event: string, callback: (data: any) => void) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  off: (event: string, callback: (data: any) => void) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  socketId: string;
}