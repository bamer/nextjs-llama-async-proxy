"use client";

import { Grid } from "@mui/material";
import { MetricCard } from "./MetricCard";
import type { SystemMetrics } from "@/lib/store";

interface MetricsGridProps {
  metrics: SystemMetrics | null;
  isDark: boolean;
}

export function MetricsGrid({ metrics, isDark }: MetricsGridProps) {
  return (
    <Grid container spacing={3} mb={4}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Memory Usage"
          value={metrics?.memory?.used ?? 0}
          unit="%"
          icon="Memory"
          color="primary"
          threshold={85}
          progress={metrics?.memory?.used ?? 0}
          isDark={isDark}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="CPU Usage"
          value={metrics?.cpu?.usage ?? 0}
          unit="%"
          icon="Computer"
          color="secondary"
          threshold={90}
          progress={metrics?.cpu?.usage ?? 0}
          isDark={isDark}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Disk Usage"
          value={metrics?.disk?.used ?? 0}
          unit="%"
          icon="Storage"
          color="success"
          threshold={95}
          progress={metrics?.disk?.used ?? 0}
          isDark={isDark}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Network RX"
          value={(metrics?.network?.rx ?? 0).toFixed(1)}
          unit=" MB/s"
          icon="NetworkCheck"
          color="info"
          progress={Math.min(100, ((metrics?.network?.rx ?? 0) / 1000) * 100)}
          label="Network throughput"
          isDark={isDark}
        />
      </Grid>
    </Grid>
  );
}
