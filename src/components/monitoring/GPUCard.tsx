"use client";

import { Card, CardContent, Typography, Box, LinearProgress, Chip, IconButton, Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Sparkline } from "@/components/charts/Sparkline";

interface GPUProcess {
  pid: number;
  name: string;
  memoryMb: number;
}

interface GPUCardProps {
  gpuIndex: number;
  name: string;
  usage: number;
  memoryUsed: number;
  memoryTotal: number;
  temperature: number;
  powerUsed: number;
  powerTotal: number;
  processes?: GPUProcess[];
  history?: number[];
}

export function GPUCard({
  gpuIndex,
  name,
  usage,
  memoryUsed,
  memoryTotal,
  temperature,
  powerUsed,
  powerTotal,
  processes = [],
  history = [],
}: GPUCardProps) {
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const cardSx = {
    background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
    backdropFilter: "blur(10px)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
  };

  const getTempColor = (t: number) => (t < 70 ? "success" : t < 80 ? "warning" : "error");
  const getUsageColor = (v: number) => (v < 50 ? "#10b981" : v < 80 ? "#f59e0b" : "#ef4444");

  return (
    <Card sx={cardSx}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight="bold">GPU {gpuIndex}</Typography>
            <Chip label={name} size="small" variant="outlined" />
          </Box>
          <Chip label={`${temperature}°C`} color={getTempColor(temperature)} size="small" />
        </Box>

        <Box display="flex" gap={3} mb={2}>
          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">Usage</Typography>
              <Typography variant="body2" fontWeight="bold">{usage.toFixed(1)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={usage} sx={{ height: 8, borderRadius: 4, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", "& .MuiLinearProgress-bar": { backgroundColor: getUsageColor(usage) } }} />
            {history.length > 0 && <Box mt={1}><Sparkline data={history} width={120} height={30} color={getUsageColor(usage)} /></Box>}
          </Box>

          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">Memory</Typography>
              <Typography variant="body2" fontWeight="bold">{(memoryUsed / 1024).toFixed(1)} / {(memoryTotal / 1024).toFixed(1)} GB</Typography>
            </Box>
            <LinearProgress variant="determinate" value={(memoryUsed / memoryTotal) * 100} color="info" sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">Power</Typography>
              <Typography variant="body2" fontWeight="bold">{powerUsed.toFixed(0)} / {powerTotal.toFixed(0)} W</Typography>
            </Box>
            <LinearProgress variant="determinate" value={(powerUsed / powerTotal) * 100} color="secondary" sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        </Box>

        {processes.length > 0 && (
          <Box>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              <ExpandMoreIcon sx={{ transform: expanded ? "rotate(180deg)" : "none" }} />
            </IconButton>
            <Typography variant="body2" color="text.secondary" component="span">{processes.length} processes</Typography>
            <Collapse in={expanded}>
              <Box mt={1} maxHeight={120} overflow="auto">
                {processes.map((proc) => (
                  <Box key={proc.pid} display="flex" justifyContent="space-between" py={0.5} px={1} sx={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderRadius: 1, mb: 0.5 }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{proc.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{proc.memoryMb.toFixed(0)} MB</Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
