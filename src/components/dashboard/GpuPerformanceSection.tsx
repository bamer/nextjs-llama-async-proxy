'use client';

import { Box, Typography, Grid } from "@mui/material";
import { m } from "framer-motion";
import { GpuMetricsCard } from "./GpuMetricsCard";
import { useTheme } from "@/contexts/ThemeContext";

interface GpuPerformanceSectionProps {
  gpuUsage: number;
  gpuName?: string;
  gpuMemoryUsed?: number;
  gpuMemoryTotal?: number;
  gpuMemoryUsage: number;
  gpuPowerUsage: number;
  gpuPowerLimit: number;
  gpuTemperature: number;
}

export function GpuPerformanceSection(
  props: GpuPerformanceSectionProps
): React.ReactNode {
  const { isDark } = useTheme();

  const getTemperatureColor = (temp: number) => {
    if (temp > 85) return "error";
    if (temp > 70) return "warning";
    return "success";
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp < 60) return "Normal";
    if (temp < 80) return "Warm";
    return "Hot";
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Typography variant="h5" fontWeight="bold" mb={3}>
        GPU Performance
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <GpuMetricsCard
            label="GPU Usage"
            value={props.gpuUsage.toString()}
            unit="%"
            percentage={props.gpuUsage}
            color={
              props.gpuUsage > 80
                ? "error"
                : props.gpuUsage > 60
                  ? "warning"
                  : "success"
            }
            subtext={props.gpuName || "GPU"}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <GpuMetricsCard
            label="GPU Memory"
            value={`${props.gpuMemoryUsed ? (props.gpuMemoryUsed / 1024).toFixed(1) : "0"} / ${props.gpuMemoryTotal ? (props.gpuMemoryTotal / 1024).toFixed(1) : "0"}`}
            unit="GB"
            percentage={props.gpuMemoryUsage || 0}
            color={
              (props.gpuMemoryUsage || 0) > 90
                ? "error"
                : (props.gpuMemoryUsage || 0) > 70
                  ? "warning"
                  : "success"
            }
            subtext={`${props.gpuMemoryUsage}% used`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <GpuMetricsCard
            label="GPU Power"
            value={`${props.gpuPowerUsage} / ${props.gpuPowerLimit}`}
            unit="W"
            percentage={((props.gpuPowerUsage ?? 0) / (props.gpuPowerLimit ?? 1)) * 100}
            color={
              (props.gpuPowerUsage ?? 0) / (props.gpuPowerLimit ?? 1) > 0.9
                ? "error"
                : (props.gpuPowerUsage ?? 0) / (props.gpuPowerLimit ?? 1) > 0.7
                  ? "warning"
                  : "success"
            }
            subtext={`${(((props.gpuPowerUsage ?? 0) / (props.gpuPowerLimit ?? 1)) * 100).toFixed(1)}% of limit`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <GpuMetricsCard
            label="GPU Temperature"
            value={props.gpuTemperature.toString()}
            unit="°C"
            percentage={props.gpuTemperature || 0}
            color={getTemperatureColor(props.gpuTemperature)}
            subtext={getTemperatureStatus(props.gpuTemperature || 0)}
          />
        </Grid>
      </Grid>
    </m.div>
  );
}
