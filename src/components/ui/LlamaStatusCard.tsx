import { useLlamaStatus } from "@/hooks/useLlamaStatus";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Chip,
  Stack,
  CircularProgress,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";

const STATUS_COLORS: Record<string, "success" | "info" | "warning" | "error"> = {
  ready: "success",
  starting: "info",
  error: "error",
  crashed: "error",
  initial: "info",
  stopping: "warning",
};

const STATUS_LABELS: Record<string, string> = {
  ready: "Ready",
  starting: "Starting",
  error: "Error",
  crashed: "Crashed",
  initial: "Initializing",
  stopping: "Stopping",
};

export function LlamaStatusCard(): ReactNode {
  const { status, models, isLoading, lastError, retries, uptime, startedAt } =
    useLlamaStatus();

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">🦙 Llama Server Status</Typography>
            {isLoading && <CircularProgress size={20} />}
          </Box>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {/* Status Chip */}
          <Box>
            <Chip
              label={STATUS_LABELS[status] || status}
              color={STATUS_COLORS[status] || "default"}
              size="medium"
              variant="outlined"
            />
          </Box>

          {/* Error Alert */}
          {lastError && (
            <Box
              sx={{
                padding: "12px",
                backgroundColor: "#ffebee",
                border: "1px solid #f44336",
                borderRadius: "4px",
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "#d32f2f", fontWeight: 600 }}>
                Error
              </Typography>
              <Typography variant="body2" sx={{ color: "#d32f2f", marginTop: "4px" }}>
                {lastError}
                {retries > 0 && ` (Retries: ${retries}/5)`}
              </Typography>
            </Box>
          )}

          {/* Server Info */}
          <Box>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <span className="font-semibold">Status:</span>
                <span>{STATUS_LABELS[status] || status}</span>
              </Box>

              {startedAt && (
                <>
                  <Box display="flex" justifyContent="space-between">
                    <span className="font-semibold">Uptime:</span>
                    <span>{formatUptime(uptime)}</span>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <span className="font-semibold">Started:</span>
                    <span className="text-sm">
                      {new Date(startedAt).toLocaleTimeString()}
                    </span>
                  </Box>
                </>
              )}

              {status !== "initial" && status !== "starting" && (
                <Box display="flex" justifyContent="space-between">
                  <span className="font-semibold">Models Available:</span>
                  <span>{models.length}</span>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Models List */}
          {models.length > 0 && status === "ready" && (
            <Box>
              <h3 className="font-semibold mb-2">Available Models</h3>
              <Box
                className="space-y-1"
                sx={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  padding: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  borderRadius: "4px",
                }}
              >
                {models.map((model) => (
                  <Box
                    key={model.id}
                    className="text-sm p-2 rounded border border-gray-200"
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-gray-600">
                      {model.size
                        ? `${(model.size / 1024 / 1024 / 1024).toFixed(2)} GB`
                        : "Size unknown"}
                    </div>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Loading State */}
          {(status === "starting" || status === "initial") && (
            <Box className="text-center py-4">
              <CircularProgress size={40} />
              <p className="mt-2 text-sm text-gray-600">
                {status === "starting"
                  ? "Starting llama-server..."
                  : "Initializing..."}
              </p>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
