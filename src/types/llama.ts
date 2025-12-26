export interface LlamaModel {
  id: string;
  name: string;
  size: number;
  type: string;
  modified_at: number;
  available: boolean; // Indicates if model is available for loading
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type LlamaServiceStatus =
  | "initial"
  | "starting"
  | "ready"
  | "error"
  | "crashed"
  | "stopping";

export interface LlamaStatus {
  status: LlamaServiceStatus;
  models: LlamaModel[];
  lastError: string | null;
  retries: number;
  uptime: number;
  startedAt: string | null;
}

export interface LlamaStatusEvent {
  type: "llama_status";
  data: LlamaStatus;
  timestamp: number;
}
