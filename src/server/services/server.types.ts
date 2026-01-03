import type { Socket } from "socket.io";
import type { LlamaService, LlamaModel } from "./llama/LlamaService";
import type { SystemMetrics } from "@/types/monitoring";

export interface MetricsData {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  gpu_usage: number;
  gpu_temperature: number;
  gpu_memory_used: number;
  gpu_memory_total: number;
  gpu_power_usage: number;
  active_models: number;
  uptime: number;
  requests_per_minute: number;
}

export interface ModelDisplayData {
  id: string;
  name: string;
  type: string;
  status: string;
  size?: number;
  template?: string;
  availableTemplates?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConfigHandler {
  loadConfig(id: number, type: string): Promise<unknown>;
  saveConfig(id: number, type: string, config: unknown): Promise<unknown>;
}

export interface WebSocketHandlersDependencies {
  llamaService: LlamaService | null;
  modelImportService: unknown;
  collectMetrics: () => Promise<SystemMetrics>;
  broadcastState: (state: unknown) => void;
}

export type WebSocketHandlerFactory = (
  socket: Socket,
  dependencies: WebSocketHandlersDependencies
) => void;
