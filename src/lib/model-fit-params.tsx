/**
 * Fit params display logic utilities
 * Extracted from FitParamsDialog for reusability
 */

import { Box, Typography } from "@mui/material";
import type { FitParamsData } from "@/hooks/use-fit-params";

export interface FitParamInfo {
  key: string;
  label: string;
  value: string;
  description?: string;
}

/**
 * Check if fit params has any recommendations
 */
export function hasRecommendations(fitParams: FitParamsData | null): boolean {
  return (
    fitParams !== null &&
    (fitParams.recommended_ctx_size !== null ||
      fitParams.recommended_gpu_layers !== null ||
      fitParams.recommended_tensor_split !== null ||
      fitParams.projected_cpu_memory_mb !== null ||
      fitParams.projected_gpu_memory_mb !== null)
  );
}

/**
 * Format memory in MB/GB
 */
export function formatMemory(memoryMb: number | null | undefined): string {
  if (memoryMb === null || memoryMb === undefined) {
    return "N/A";
  }

  return memoryMb < 1024
    ? `${Math.round(memoryMb)} MB`
    : `${(memoryMb / 1024).toFixed(1)} GB`;
}

/**
 * Format context size with thousands separator
 */
export function formatContextSize(ctxSize: number | null | undefined): string {
  if (ctxSize === null || ctxSize === undefined) {
    return "N/A";
  }

  return ctxSize.toLocaleString() + " tokens";
}

/**
 * Get all available parameter keys
 */
export function getAllParamKeys(fitParams: FitParamsData | null): string[] {
  const params: string[] = [];

  if (!fitParams) {
    return params;
  }

  if (fitParams.recommended_ctx_size !== null) params.push("ctx_size");
  if (fitParams.recommended_gpu_layers !== null) params.push("gpu_layers");
  if (fitParams.recommended_tensor_split !== null) params.push("tensor_split");
  if (fitParams.projected_cpu_memory_mb !== null) params.push("cpu_memory");
  if (fitParams.projected_gpu_memory_mb !== null) params.push("gpu_memory");

  return params;
}

/**
 * Get parameter display information
 */
export function getFitParamInfo(fitParams: FitParamsData | null, paramKey: string): FitParamInfo | null {
  if (!fitParams) {
    return null;
  }

  switch (paramKey) {
    case "ctx_size":
      return {
        key: "ctx_size",
        label: "Context Size",
        value: formatContextSize(fitParams.recommended_ctx_size),
      };

    case "gpu_layers":
      return {
        key: "gpu_layers",
        label: "GPU Layers",
        value: `${fitParams.recommended_gpu_layers} layers`,
      };

    case "tensor_split":
      return {
        key: "tensor_split",
        label: "Tensor Split",
        value: fitParams.recommended_tensor_split || "N/A",
      };

    case "cpu_memory":
      return {
        key: "cpu_memory",
        label: "Projected CPU Memory",
        value: formatMemory(fitParams.projected_cpu_memory_mb),
      };

    case "gpu_memory":
      return {
        key: "gpu_memory",
        label: "Projected GPU Memory",
        value: formatMemory(fitParams.projected_gpu_memory_mb),
      };

    default:
      return null;
  }
}

/**
 * Get all parameter display information
 */
export function getAllFitParamsInfo(fitParams: FitParamsData | null): FitParamInfo[] {
  const keys = getAllParamKeys(fitParams);

  return keys
    .map((key) => getFitParamInfo(fitParams, key))
    .filter((info): info is FitParamInfo => info !== null);
}

/**
 * Get status message based on fit params data
 */
export function getFitParamsStatus(fitParams: FitParamsData | null): {
  severity: "info" | "warning" | "success" | "error";
  message: string;
} {
  if (!fitParams || fitParams.fit_params_error) {
    return {
      severity: "info",
      message: fitParams?.fit_params_error ||
        "No fit-params analysis available. Run \"Analyze model with llama-fit-params\" first.",
    };
  }

  if (!hasRecommendations(fitParams)) {
    return {
      severity: "warning",
      message: "Analysis completed but no parameter recommendations were found. This may indicate the model is already well-optimized.",
    };
  }

  return {
    severity: "success",
    message: fitParams.fit_params_success ? "Analysis completed successfully" : "Analysis completed with warnings",
  };
}

/**
 * Render analysis status box
 */
export function renderAnalysisStatus(fitParams: FitParamsData | null, isDark: boolean): React.ReactElement {
  const status = getFitParamsStatus(fitParams);

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor: isDark ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.06)",
        borderRadius: 1,
      }}
    >
      <Typography
        variant="body2"
        fontWeight="medium"
        color={status.severity === "success" ? "success.main" : "text.primary"}
      >
        {status.message}
      </Typography>
      {fitParams?.fit_params_error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          Error: {fitParams.fit_params_error}
        </Typography>
      )}
    </Box>
  );
}
