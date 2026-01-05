"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, Typography, Box, Chip, Divider } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

export interface ActiveModel {
  name: string;
  status: "running" | "stopped" | "loading";
  tokensPerSec: number;
  memoryUsed: number;
  uptime: number;
  activeRequests?: number;
}

interface ActiveModelsSummaryProps {
  models: ActiveModel[];
  totalMemoryUsage?: number;
  totalActiveRequests?: number;
}

const MemoizedActiveModelsSummary = memo(function ActiveModelsSummary({
  models,
  totalMemoryUsage,
  totalActiveRequests,
}: ActiveModelsSummaryProps) {
  const { isDark } = useTheme();
  const runningModels = useMemo(() => models.filter((m) => m.status === "running"), [models]);

  const memoryUsage = useMemo(() => {
    if (totalMemoryUsage !== undefined) return totalMemoryUsage;
    return runningModels.reduce((sum, m) => sum + m.memoryUsed, 0);
  }, [runningModels, totalMemoryUsage]);

  const activeRequests = useMemo(() => {
    if (totalActiveRequests !== undefined) return totalActiveRequests;
    return runningModels.reduce((sum, m) => sum + (m.activeRequests || 0), 0);
  }, [runningModels, totalActiveRequests]);

  const formatMemory = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "success";
      case "loading":
        return "warning";
      case "stopped":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "running":
        return "running";
      case "loading":
        return "loading";
      case "stopped":
        return "idle";
      default:
        return status;
    }
  };

  return (
    <Card sx={{
      height: "100%",
      background: isDark
        ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
        : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
      boxShadow: isDark
        ? "0 4px 20px rgba(0, 0, 0, 0.3)"
        : "0 4px 20px rgba(0, 0, 0, 0.05)",
    }}>
      <CardHeader
        title={<Typography variant="h6" fontWeight="bold">Active Models</Typography>}
        subheader={`${runningModels.length} running`}
        titleTypographyProps={{ fontSize: "1.25rem" }}
        action={
          <Link href="/models" style={{ textDecoration: "none" }}>
            <Typography variant="body2" color="primary" sx={{ "&:hover": { textDecoration: "underline" } }}>
              View All
            </Typography>
          </Link>
        }
      />
      <CardContent>
        <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Active</Typography>
            <Typography variant="h5" fontWeight="bold">{runningModels.length}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Memory</Typography>
            <Typography variant="h5" fontWeight="bold">{formatMemory(memoryUsage)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Active Requests</Typography>
            <Typography variant="h5" fontWeight="bold">{activeRequests.toLocaleString()}</Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ maxHeight: 200, overflow: "auto" }}>
          {runningModels.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
              No models currently running
            </Typography>
          ) : (
            runningModels.map((model) => (
              <Box
                key={model.name}
                sx={{
                  mb: 1.5,
                  p: 1,
                  borderRadius: 1,
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="medium">{model.name}</Typography>
                  <Chip
                    label={getStatusLabel(model.status)}
                    color={getStatusColor(model.status)}
                    size="small"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">
                    {model.tokensPerSec.toFixed(1)} tok/s
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatMemory(model.memoryUsed)} • {model.activeRequests ? `${model.activeRequests} req` : ""} • {formatUptime(model.uptime)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

export { MemoizedActiveModelsSummary as ActiveModelsSummary };
