"use client";

import { useState, useEffect, useCallback } from "react";

export interface ModelMetadata {
  file_size_bytes: number;
  quantization_type: string | null;
  parameter_count: number | null;
  architecture: string | null;
  context_window: number | null;
}

export interface FitParamsData {
  id?: number;
  model_id?: number;
  recommended_ctx_size?: number | null;
  recommended_gpu_layers?: number | null;
  recommended_tensor_split?: string | null;
  file_size_bytes?: number | null;
  quantization_type?: string | null;
  parameter_count?: number | null;
  architecture?: string | null;
  context_window?: number | null;
  fit_params_analyzed_at?: number | null;
  fit_params_success?: number | null;
  fit_params_error?: string | null;
  fit_params_raw_output?: string | null;
  projected_cpu_memory_mb?: number | null;
  projected_gpu_memory_mb?: number | null;
  created_at?: number;
  updated_at?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

export function useFitParams(modelName: string | null) {
  const [data, setData] = useState<FitParamsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!modelName) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/analyze`);
      const result: ApiResponse<{ model: unknown; fitParams: FitParamsData | null }> = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch fit-params data");
      }

      if (result.success && result.data?.fitParams) {
        setData(result.data.fitParams);
      } else {
        setData(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[useFitParams] Error fetching fit-params:", err);
    } finally {
      setLoading(false);
    }
  }, [modelName]);

  const analyze = useCallback(async (): Promise<void> => {
    if (!modelName) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result: ApiResponse<{ model: unknown; fitParams: FitParamsData }> = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to analyze model");
      }

      if (result.success && result.data?.fitParams) {
        setData(result.data.fitParams);
      }

      // Refresh data from database after POST completes to get latest results
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[useFitParams] Error analyzing model:", err);
    } finally {
      setLoading(false);
    }
  }, [modelName, refresh]);

  useEffect(() => {
    if (modelName) {
      refresh();
    }
  }, [modelName, refresh]);

  return { data, loading, error, analyze, refresh };
}
