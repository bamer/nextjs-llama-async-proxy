"use client";

/**
 * Dashboard-specific model configuration type
 * Used by MemoizedModelItem and related components
 */
export interface ModelConfig {
  id: string;
  name: string;
  status: "idle" | "loading" | "running" | "error";
  type: "llama" | "mistral" | "other";
  progress?: number;
  template?: string;
  availableTemplates?: string[];
}
