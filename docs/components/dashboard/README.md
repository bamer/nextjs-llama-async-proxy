# Dashboard Components

Comprehensive guide for dashboard-specific components.

## Table of Contents

- [MetricCard](#metriccard)
- [CircularGauge](#circulargauge)
- [QuickActionsCard](#quickactionscard)
- [MetricsGrid](#metricsgrid)
- [ChartsSection](#chartssection)
- [DashboardHeader](#dashboardheader)
- [DashboardActions](#dashboardactions)
- [ServerStatusSection](#serverstatussection)
- [GPUMetricsSection](#gpumetricssection)

---

## MetricCard

### Purpose
Performance metric display with linear progress bar, trend indicator, and optional gauge.

### Props

```typescript
interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  trend?: number;
  icon?: string;
  isDark: boolean;
  threshold?: number;
  showGauge?: boolean;
}
```

### Usage

```typescript
import { MetricCard } from "@/components/dashboard";

function Example() {
  return (
    <MetricCard
      title="CPU Usage"
      value={75.5}
      unit="%"
      trend={5}
      icon="📊"
      isDark={false}
      threshold={80}
      showGauge={false}
    />
  );
}
```

### Features
- Linear progress bar with color coding
- Trend indicator (up/down percentage)
- Optional circular gauge display
- Threshold-based status colors
- Memoized for performance

### Status Colors
- **Green**: Value < threshold * 0.7 (Normal)
- **Yellow**: Value < threshold (Medium)
- **Red**: Value ≥ threshold (High)

### Performance
Component is memoized with custom comparison to prevent unnecessary re-renders.

---

## CircularGauge

### Purpose
Circular gauge chart using @mui/x-charts with color coding and responsive sizing.

### Props

```typescript
interface CircularGaugeProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  unit?: string;
  label?: string;
  threshold?: number;
  isDark?: boolean;
}
```

### Usage

```typescript
import { CircularGauge } from "@/components/dashboard";

function Example() {
  return (
    <CircularGauge
      value={75}
      min={0}
      max={100}
      size={150}
      unit="%"
      label="CPU"
      threshold={80}
      isDark={false}
    />
  );
}
```

### Features
- Responsive sizing (scales down on mobile)
- Threshold-based color coding
- Custom min/max values
- Unit and label display
- Memoized for performance

### Color Logic
- **Success**: value ≤ threshold * 0.7
- **Warning**: threshold * 0.7 < value ≤ threshold
- **Error**: value > threshold

### Dependencies
- @mui/x-charts/Gauge
- MUI useMediaQuery (responsive)

---

## QuickActionsCard

### Purpose
Card with server action buttons (Start, Restart).

### Props

```typescript
interface QuickActionsCardProps {
  isDark: boolean;
  onRestartServer: () => void;
  onStartServer: () => void;
  serverRunning?: boolean;
  serverLoading?: boolean;
}
```

### Usage

```typescript
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";

function Example() {
  const handleRestart = async () => {
    await restartServer();
  };

  const handleStart = async () => {
    await startServer();
  };

  return (
    <QuickActionsCard
      isDark={false}
      onRestartServer={handleRestart}
      onStartServer={handleStart}
      serverRunning={true}
      serverLoading={false}
    />
  );
}
```

### Features
- Memoized actions
- Loading state handling
- Disabled states
- Theme-aware styling

---

## MetricsGrid

### Purpose
Grid layout for displaying multiple MetricCard components.

### Usage

```typescript
import { MetricsGrid } from "@/components/dashboard";
import { Grid } from "@mui/material";

function Example() {
  const metrics = [
    { title: "CPU", value: 75, unit: "%" },
    { title: "Memory", value: 60, unit: "%" },
    { title: "GPU", value: 90, unit: "%" },
  ];

  return (
    <Grid container spacing={3}>
      {metrics.map((metric) => (
        <Grid key={metric.title} size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard {...metric} isDark={false} />
        </Grid>
      ))}
    </Grid>
  );
}
```

### Layout
- Mobile (xs): 1 column (12 spans)
- Tablet (sm): 2 columns (6 spans)
- Desktop (md): 3+ columns (4 spans)

---

## ChartsSection

### Purpose
Container for performance charts with responsive layout.

### Usage

```typescript
import { ChartsSection } from "@/components/dashboard";
import { PerformanceChart } from "@/components/charts";

function Example() {
  return (
    <ChartsSection>
      <PerformanceChart
        data={cpuHistory}
        title="CPU Usage"
        color="#3b82f6"
      />
      <PerformanceChart
        data={memoryHistory}
        title="Memory Usage"
        color="#10b981"
      />
    </ChartsSection>
  );
}
```

### Features
- Responsive grid layout
- Chart height consistency
- Theme-aware background

---

## DashboardHeader

### Purpose
Header section for dashboard with title and status.

### Usage

```typescript
import { DashboardHeader } from "@/components/dashboard";

function Example() {
  return <DashboardHeader />;
}
```

### Features
- Dashboard title
- Server status indicator
- Last update timestamp

---

## DashboardActions

### Purpose
Action buttons for dashboard operations (Refresh, Restart, Download Logs).

### Usage

```typescript
import { DashboardActions } from "@/components/dashboard";

function Example() {
  const handleRefresh = async () => {
    await refreshData();
  };

  const handleRestart = async () => {
    await restartServer();
  };

  const handleDownload = () => {
    downloadLogs();
  };

  return (
    <DashboardActions
      onRefresh={handleRefresh}
      onRestart={handleRestart}
      onDownload={handleDownload}
    />
  );
}
```

### Features
- Restart server
- Refresh data
- Download logs
- Loading states

---

## ServerStatusSection

### Purpose
Display server status and basic information.

### Usage

```typescript
import { ServerStatusSection } from "@/components/dashboard";

function Example() {
  return <ServerStatusSection />;
}
```

### Information Displayed
- Server status (Running/Stopped)
- Uptime
- Connected models
- API endpoint

---

## GPUMetricsSection

### Purpose
Detailed GPU metrics display with memory and utilization.

### Usage

```typescript
import { GPUMetricsSection } from "@/components/dashboard";

function Example() {
  return <GPUMetricsSection />;
}
```

### Metrics Displayed
- GPU utilization per device
- GPU memory usage
- GPU power consumption
- GPU temperature
- Available GPU devices

---

## Usage Patterns

### Complete Dashboard Layout

```typescript
import {
  DashboardHeader,
  MetricsGrid,
  ChartsSection,
  QuickActionsCard,
  ServerStatusSection,
  GPUMetricsSection,
} from "@/components/dashboard";

function DashboardPage() {
  return (
    <Box>
      <DashboardHeader />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <MetricsGrid />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <QuickActionsCard />
        </Grid>
      </Grid>

      <ServerStatusSection />

      <ChartsSection />

      <GPUMetricsSection />
    </Box>
  );
}
```

### With Real-Time Updates

```typescript
import { useDashboardData } from "@/hooks";
import { MetricCard } from "@/components/dashboard";

function LiveDashboard() {
  const { metrics, loading, error } = useDashboardData();

  if (loading) return <Loading />;
  if (error) return <ErrorFallback message={error} />;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="CPU Usage"
          value={metrics?.cpuUsage || 0}
          unit="%"
          isDark={false}
          threshold={80}
        />
      </Grid>
      {/* More metrics */}
    </Grid>
  );
}
```

### Memoized Metric Cards

```typescript
import { memo } from "react";
import { MetricCard } from "@/components/dashboard";

const MemoizedMetric = memo(
  ({ title, value, unit, threshold }) => (
    <MetricCard
      title={title}
      value={value}
      unit={unit}
      isDark={false}
      threshold={threshold}
    />
  ),
  (prev, next) => prev.value === next.value
);
```

---

## Performance Considerations

### 1. Use Memoization
Dashboard components are heavily optimized:

```typescript
import { memo } from "react";

export const MetricCard = memo(MetricCardComponent, (prev, next) => {
  // Only re-render if critical props change
  return (
    prev.value === next.value &&
    prev.threshold === next.threshold
  );
});
```

### 2. Debounce Updates
Use useDebouncedState for frequent updates:

```typescript
const [debouncedValue, setDebouncedValue] = useDebouncedState(
  metricsValue,
  300 // 300ms debounce
);
```

### 3. Lazy Load Charts
Code split heavy chart components:

```typescript
const PerformanceChart = lazy(() =>
  import("@/components/charts/PerformanceChart")
);
```

---

## Data Flow

```
WebSocket → useDashboardData → Dashboard State → Components
                         ↓
                    useChartHistory → Chart Data → ChartsSection
```

### Real-Time Updates

```typescript
// WebSocket provides real-time metrics
useWebSocket("metrics", (data) => {
  // Metrics update automatically
});

// Chart history accumulates data
useChartHistory(); // Batches updates every 5 seconds
```

---

## Best Practices

### 1. Responsive Design
Use Material-UI breakpoints:

```typescript
<Grid container spacing={3}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <MetricCard />
  </Grid>
</Grid>
```

### 2. Error Handling
Wrap dashboard in ErrorBoundary:

```typescript
<ErrorBoundary fallback={<DashboardFallback />}>
  <DashboardContent />
</ErrorBoundary>
```

### 3. Loading States
Show loading indicators during data fetch:

```typescript
<WithLoading loading={loading}>
  <MetricsGrid />
</WithLoading>
```

### 4. Threshold Configuration
Set appropriate thresholds for each metric:

```typescript
<MetricCard
  title="CPU Usage"
  value={cpuUsage}
  threshold={80} // Warning at 80%
/>

<MetricCard
  title="Memory Usage"
  value={memoryUsage}
  threshold={90} // Warning at 90%
/>
```

---

## Integration with Hooks

### useDashboardData

```typescript
import { useDashboardData } from "@/hooks";

function Dashboard() {
  const { metrics, loading, error, connectionState } = useDashboardData();

  return (
    <>
      <StatusBadge status={connectionState === "connected" ? "running" : "idle"} />
      <MetricsGrid metrics={metrics} />
    </>
  );
}
```

### useDashboardActions

```typescript
import { useDashboardActions } from "@/hooks";

function Dashboard() {
  const { handleRestart, handleRefresh, handleDownloadLogs } =
    useDashboardActions();

  return (
    <DashboardActions
      onRestart={handleRestart}
      onRefresh={handleRefresh}
      onDownload={handleDownloadLogs}
    />
  );
}
```

### useChartHistory

```typescript
import { useChartHistory } from "@/hooks";
import { ChartsSection } from "@/components/dashboard";

function Dashboard() {
  const chartHistory = useChartHistory();

  return <ChartsSection history={chartHistory} />;
}
```

---

## Styling Guidelines

### Dark Mode

All dashboard components respect ThemeContext:

```typescript
const { isDark } = useTheme();

// Components automatically adapt
<MetricCard isDark={isDark} />
```

### Spacing

Use consistent spacing (multiples of 8px):

```typescript
<Grid container spacing={3}> // 24px
  <Grid item>
    <MetricCard />
  </Grid>
</Grid>
```

### Cards

Use ThemedCard for consistent styling:

```typescript
import { ThemedCard } from "@/components/ui";

<ThemedCard variant="gradient">
  <DashboardContent />
</ThemedCard>
```

---

## Dependencies

| Component | External Dependencies | Internal Dependencies |
|-----------|---------------------|---------------------|
| MetricCard | MUI Card, Chip, LinearProgress | CircularGauge |
| CircularGauge | @mui/x-charts/Gauge, useMediaQuery | ThemeContext |
| QuickActionsCard | MUI Card, Grid, Button | ThemeContext, useDashboardActions |
| MetricsGrid | MUI Grid | MetricCard |
| ChartsSection | MUI Box | PerformanceChart |
| DashboardHeader | MUI Typography | useStore |
| DashboardActions | MUI Button | useDashboardActions |
| ServerStatusSection | MUI Card | useDashboardData |
| GPUMetricsSection | MUI Card, Grid | GPUUMetricsCard |

---

## See Also

- [UI Components](../ui/README.md)
- [Form Components](../forms/README.md)
- [Custom Hooks](../../hooks/README.md)
- [Component Library Overview](../README.md)
