import { io, Socket } from "socket.io-client";
import { APP_CONFIG } from "@/config/app.config";
import { useStore } from "@/lib/store";
import { WebSocketMessage, SystemMetrics, LogEntry, ModelConfig } from "@/types";

class WebSocketService {
  private socket: Socket | null = null;
  private readonly url: string;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionState: "disconnected" | "connecting" | "connected" | "error" = "disconnected";
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.url = APP_CONFIG.api.websocketUrl;
  }

  public connect(): void {
    if (this.socket && this.socket.connected) {
      console.log("Already connected to WebSocket");
      return;
    }

    if (this.connectionState === "connecting") {
      console.log("Already connecting...");
      return;
    }

    this.setConnectionState("connecting");
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
      this.setConnectionState("connected");
      console.log("WebSocket connected:", this.socket?.id);
      useStore.getState().setLoading(false);
      useStore.getState().clearError();
      this.triggerEvent("connect");
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      useStore.getState().setError("WebSocket connection failed");
      this.setConnectionState("error");
      this.handleReconnect();
      this.triggerEvent("connect_error", error);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.setConnectionState("disconnected");
      if (reason !== "io client disconnect") {
        this.handleReconnect();
      }
      this.triggerEvent("disconnect", reason);
    });

    this.socket.on("reconnect", (attempt) => {
      console.log("WebSocket reconnected, attempt:", attempt);
      this.setConnectionState("connected");
      useStore.getState().setLoading(false);
      this.triggerEvent("reconnect", attempt);
    });

    this.socket.on("reconnect_attempt", (attempt) => {
      console.log("WebSocket reconnect attempt:", attempt);
      useStore.getState().setLoading(true);
      this.triggerEvent("reconnect_attempt", attempt);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("WebSocket reconnect error:", error);
      useStore.getState().setError("WebSocket reconnection failed");
      this.setConnectionState("error");
      this.triggerEvent("reconnect_error", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed");
      useStore.getState().setError("Could not reconnect to WebSocket");
      this.setConnectionState("error");
      this.triggerEvent("reconnect_failed");
    });

    // Custom message handlers
    this.socket.on("status", (message: WebSocketMessage) => {
      console.log("Status update:", message);
      this.triggerEvent("status", message);
    });

    this.socket.on("metrics", (message: WebSocketMessage<SystemMetrics>) => {
      console.log("Metrics update:", message.data);
      useStore.getState().setMetrics(message.data);
      this.triggerEvent("metrics", message);
    });

    this.socket.on("logs", (message: WebSocketMessage<LogEntry>) => {
      console.log("Log update:", message.data);
      useStore.getState().addLog(message.data);
      this.triggerEvent("logs", message);
    });

    this.socket.on("models", (message: WebSocketMessage<ModelConfig[]>) => {
      console.log("Models update:", message.data);
      useStore.getState().setModels(message.data);
      this.triggerEvent("models", message);
    });

    this.socket.on("model_status", (message: WebSocketMessage<ModelConfig>) => {
      console.log("Model status update:", message.data);
      useStore.getState().updateModel(message.data.id, message.data);
      this.triggerEvent("model_status", message);
    });

    this.socket.on("error", (message: WebSocketMessage<{ error: string }>) => {
      console.error("WebSocket error:", message.data.error);
      useStore.getState().setError(message.data.error);
      this.triggerEvent("error", message);
    });
  }

  private setConnectionState(state: "disconnected" | "connecting" | "connected" | "error") {
    this.connectionState = state;
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      this.setConnectionState("error");
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
    this.setConnectionState("disconnected");
    console.log("WebSocket disconnected manually");
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getConnectionState(): string {
    return this.connectionState;
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

  // Event listener management
  public on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  public off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      this.eventListeners.set(
        event,
        listeners.filter((cb) => cb !== callback)
      );
    }
  }

  private triggerEvent(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
}

export const websocketService = new WebSocketService();
