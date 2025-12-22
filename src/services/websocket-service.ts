import { io, Socket } from "socket.io-client";
import { APP_CONFIG } from "@config/app.config";
import { useStore } from "../lib/store";
import { WebSocketMessage, SystemMetrics, LogEntry, ModelConfig } from "../types/global";

class WebSocketService {
  private socket: Socket | null = null;
  private readonly url: string;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.url = APP_CONFIG.api.websocketUrl;
  }

  public connect(): void {
    if (this.socket && this.socket.connected) {
      console.log("Already connected to WebSocket");
      return;
    }

    console.log(`Connecting to WebSocket: ${this.url}`);
    
    this.socket = io(this.url, {
      path: "/api/websocket",
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: true,
      transports: ["websocket"],
      withCredentials: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
      console.log("WebSocket connected:", this.socket?.id);
      useStore.getState().setLoading(false);
      useStore.getState().clearError();
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      useStore.getState().setError("WebSocket connection failed");
      this.handleReconnect();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      if (reason !== "io client disconnect") {
        this.handleReconnect();
      }
    });

    this.socket.on("reconnect", (attempt) => {
      console.log("WebSocket reconnected, attempt:", attempt);
      useStore.getState().setLoading(false);
    });

    this.socket.on("reconnect_attempt", (attempt) => {
      console.log("WebSocket reconnect attempt:", attempt);
      useStore.getState().setLoading(true);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("WebSocket reconnect error:", error);
      useStore.getState().setError("WebSocket reconnection failed");
    });

    this.socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed");
      useStore.getState().setError("Could not reconnect to WebSocket");
    });

    // Custom message handlers
    this.socket.on("status", (message: WebSocketMessage) => {
      console.log("Status update:", message);
    });

    this.socket.on("metrics", (message: WebSocketMessage<SystemMetrics>) => {
      console.log("Metrics update:", message.data);
      useStore.getState().setMetrics(message.data);
    });

    this.socket.on("logs", (message: WebSocketMessage<LogEntry>) => {
      console.log("Log update:", message.data);
      useStore.getState().addLog(message.data);
    });

    this.socket.on("models", (message: WebSocketMessage<ModelConfig[]>) => {
      console.log("Models update:", message.data);
      useStore.getState().setModels(message.data);
    });

    this.socket.on("model_status", (message: WebSocketMessage<ModelConfig>) => {
      console.log("Model status update:", message.data);
      useStore.getState().updateModel(message.data.id, message.data);
    });

    this.socket.on("error", (message: WebSocketMessage<{ error: string }>) => {
      console.error("WebSocket error:", message.data.error);
      useStore.getState().setError(message.data.error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * this.reconnectAttempts, 5000);

    console.log(`Attempting to reconnect in ${delay}ms...`);

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
    console.log("WebSocket disconnected manually");
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public sendMessage(event: string, data?: any): void {
    if (!this.socket || !this.socket.connected) {
      console.warn("WebSocket not connected, cannot send message");
      useStore.getState().setError("WebSocket not connected");
      return;
    }

    const message: WebSocketMessage = {
      type: event,
      data: data || {},
      timestamp: Date.now(),
      requestId: this.generateRequestId(),
    };

    console.log("Sending message:", message);
    this.socket.emit(event, message);
  }

  public requestMetrics(): void {
    this.sendMessage("getMetrics");
  }

  public requestLogs(): void {
    this.sendMessage("getLogs");
  }

  public requestModels(): void {
    this.sendMessage("getModels");
  }

  public startModel(modelId: string): void {
    this.sendMessage("startModel", { modelId });
  }

  public stopModel(modelId: string): void {
    this.sendMessage("stopModel", { modelId });
  }

  public updateModelConfig(modelId: string, config: Partial<ModelConfig>): void {
    this.sendMessage("updateModelConfig", { modelId, config });
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  public getConnectionState(): string {
    if (!this.socket) return "disconnected";
    return this.socket.connected ? "connected" : "connecting";
  }
}

export const websocketService = new WebSocketService();