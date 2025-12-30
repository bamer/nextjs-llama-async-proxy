# Custom Hooks

Comprehensive guide for all custom React hooks.

## Table of Contents

- [useFormState](#useformstate)
- [useNotification](#usenotification)
- [useDebouncedState](#usedebouncedstate)
- [useDashboardData](#usedashboarddata)
- [useDashboardActions](#usedashboardactions)
- [useChartHistory](#usecharthistory)
- [useSystemMetrics](#usesystemmetrics)
- [useLoggerConfig](#useloggerconfig)
- [useSettings](#usesettings)

---

## useFormState

### Purpose
Comprehensive form state management with validation, errors, and submission tracking.

### Returns

```typescript
interface UseFormStateReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  touched: Partial<Record<keyof T, boolean>>;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  clearError: <K extends keyof T>(field: K) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
}
```

### Usage

```typescript
import { useFormState } from "@/hooks";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginForm() {
  const { values, setValue, errors, isSubmitting, resetForm } =
    useFormState<LoginFormData>({
      email: "",
      password: "",
      rememberMe: false,
    });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await login(values);
      showNotification("Login successful", "success");
    } catch (error) {
      setErrors({ email: "Invalid credentials" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Email"
        name="email"
        value={values.email}
        onChange={setValue}
        error={errors.email}
      />
      {/* More fields */}
    </form>
  );
}
```

### Features
- Automatic touched tracking
- Error clearing on value change
- Form reset functionality
- Submission state management

### Example: Validation

```typescript
const validateForm = (values: T) => {
  const errors: Partial<Record<keyof T, string>> = {};

  if (!values.email) {
    errors.email = "Email is required";
  }

  if (!values.password) {
    errors.password = "Password is required";
  }

  setErrors(errors);
  return Object.keys(errors).length === 0;
};
```

---

## useNotification

### Purpose
Display snackbars/notifications with auto-hide support.

### Returns

```typescript
interface UseNotificationReturn {
  notification: NotificationState;
  showNotification: (
    message: string,
    severity?: NotificationSeverity,
    autoHideDelay?: number
  ) => void;
  hideNotification: (
    _event?: Event | React.SyntheticEvent<any> | null,
    reason?: SnackbarCloseReason
  ) => void;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
}

type NotificationSeverity = "success" | "error" | "info" | "warning";
```

### Usage

```typescript
import { useNotification } from "@/hooks";
import { Snackbar, Alert, AlertTitle } from "@mui/material";

function MyComponent() {
  const { notification, showNotification, hideNotification } = useNotification();

  const handleAction = async () => {
    try {
      await someAsyncAction();
      showNotification("Action completed successfully", "success", 3000);
    } catch (error) {
      showNotification("Action failed", "error", 5000);
    }
  };

  return (
    <>
      <Button onClick={handleAction}>Perform Action</Button>

      <Snackbar
        open={notification.open}
        autoHideDuration={null} // Controlled by autoHideDelay
        onClose={hideNotification}
      >
        <Alert
          onClose={hideNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          <AlertTitle>
            {notification.severity.charAt(0).toUpperCase() +
              notification.severity.slice(1)}
          </AlertTitle>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
```

### Features
- Auto-hide with custom delay
- Multiple severity levels
- Clickaway prevention (optional)
- Manual close control

### Severity Levels
- **success**: Green, for successful operations
- **error**: Red, for failures
- **info**: Blue, for informational messages
- **warning**: Orange, for warnings

---

## useDebouncedState

### Purpose
Debounce state updates to reduce frequent re-renders and API calls.

### Returns

```typescript
function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T]

// Returns: [immediateValue, setImmediateValue, debouncedValue]
```

### Usage

```typescript
import { useDebouncedState } from "@/hooks";

function SearchComponent() {
  const [searchTerm, setSearchTerm, debouncedSearchTerm] = useDebouncedState(
    "",
    500 // 500ms delay
  );

  // Use debounced value for expensive operations
  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchSearchResults(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Use Cases
- Search input debouncing
- Slider value changes
- Auto-save functionality
- Chart data updates

### Example: Auto-Save

```typescript
function Editor() {
  const [content, setContent, debouncedContent] = useDebouncedState("", 2000);

  useEffect(() => {
    if (debouncedContent) {
      saveToDatabase(debouncedContent);
    }
  }, [debouncedContent]);

  return <textarea value={content} onChange={e => setContent(e.target.value)} />;
}
```

---

## useDashboardData

### Purpose
Fetch and manage dashboard data (models, metrics) with WebSocket and API integration.

### Returns

```typescript
interface UseDashboardDataReturn {
  models: Model[];
  metrics: SystemMetrics | null;
  loading: boolean;
  error: string | null;
  connectionState: ConnectionState;
}
```

### Usage

```typescript
import { useDashboardData } from "@/hooks";

function Dashboard() {
  const { models, metrics, loading, error, connectionState } = useDashboardData();

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error) return <ErrorFallback message={error} />;

  return (
    <>
      <StatusBadge
        status={connectionState === "connected" ? "running" : "idle"}
      />

      <MetricsGrid metrics={metrics} />
      <ModelsList models={models} />
    </>
  );
}
```

### Features
- WebSocket real-time updates
- API fallback for metrics
- Automatic reconnection
- Combined loading/error states
- React Query integration

### Data Flow
```
WebSocket → Real-time metrics
API → Fallback metrics
API → Models data
```

---

## useDashboardActions

### Purpose
Provide action handlers for dashboard operations (restart, refresh, download logs).

### Returns

```typescript
interface UseDashboardActionsReturn {
  handleRestart: () => Promise<void>;
  handleStart: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  handleDownloadLogs: () => void;
}
```

### Usage

```typescript
import { useDashboardActions } from "@/hooks";
import { useNotification } from "@/hooks";

function DashboardActions() {
  const { handleRestart, handleRefresh, handleDownloadLogs } =
    useDashboardActions();
  const { showNotification } = useNotification();

  const onRestart = async () => {
    try {
      await handleRestart();
      showNotification("Server restarted successfully", "success");
    } catch (error) {
      showNotification("Failed to restart server", "error");
    }
  };

  const onRefresh = async () => {
    try {
      await handleRefresh();
      showNotification("Dashboard refreshed", "info");
    } catch (error) {
      showNotification("Failed to refresh dashboard", "error");
    }
  };

  return (
    <>
      <Button onClick={onRefresh}>Refresh</Button>
      <Button onClick={onRestart}>Restart Server</Button>
      <Button onClick={handleDownloadLogs}>Download Logs</Button>
    </>
  );
}
```

### Features
- Automatic cache invalidation
- Error handling
- TypeScript safety
- React Query integration

---

## useChartHistory

### Purpose
Manage chart data history with batching, persistence, and real-time updates.

### Returns

```typescript
interface ChartHistoryData {
  cpu: ChartPoint[];
  memory: ChartPoint[];
  requests: ChartPoint[];
  gpuUtil: ChartPoint[];
  power: ChartPoint[];
}

interface ChartPoint {
  time: string;        // ISO timestamp
  displayTime: string; // Formatted time (HH:MM:SS)
  value: number;
}

// Returns chart history data
function useChartHistory(): ChartHistoryData
```

### Usage

```typescript
import { useChartHistory } from "@/hooks";
import { PerformanceChart } from "@/components/charts";

function ChartsSection() {
  const chartHistory = useChartHistory();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <PerformanceChart
          data={chartHistory.cpu}
          title="CPU Usage"
          color="#3b82f6"
          unit="%"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <PerformanceChart
          data={chartHistory.memory}
          title="Memory Usage"
          color="#10b981"
          unit="%"
        />
      </Grid>
    </Grid>
  );
}
```

### Features
- Automatic data loading from database
- Real-time WebSocket updates
- Batching (5-second debounce)
- requestIdleCallback for performance
- Automatic cleanup (last 60 points)
- Persisted across page refreshes

### Performance Optimizations
1. **Debouncing**: Updates batched every 5 seconds
2. **Idle Callback**: Uses requestIdleCallback
3. **Single Transaction**: All charts updated in one store call
4. **Memory Limit**: Keeps only last 60 data points

### Data Format

```typescript
// Chart point structure
{
  time: "2025-12-31T12:00:00.000Z",
  displayTime: "12:00:00",
  value: 75.5
}

// History structure
{
  cpu: [/* up to 60 points */],
  memory: [/* up to 60 points */],
  requests: [/* up to 60 points */],
  gpuUtil: [/* up to 60 points */],
  power: [/* up to 60 points */]
}
```

---

## useSystemMetrics

### Purpose
Fetch system metrics (CPU, memory, uptime) with polling fallback.

### Returns

```typescript
interface UseSystemMetricsReturn {
  metrics: SystemMetrics | null;
  error: string | null;
  loading: boolean;
}

interface SystemMetrics {
  cpuUsage: number;          // Percentage
  memoryUsage: number;       // Percentage
  memoryUsed: number;        // Bytes
  memoryTotal: number;       // Bytes
  uptime: number;            // Seconds
  cpuCores: number;          // Count
  loadAverage?: number[];     // [1min, 5min, 15min]
  timestamp: number;          // Unix timestamp
}
```

### Usage

```typescript
import { useSystemMetrics } from "@/hooks";

function SystemStatus() {
  const { metrics, error, loading } = useSystemMetrics();

  if (loading) return <Loading />;
  if (error) return <ErrorFallback message={error} />;

  return (
    <Card>
      <CardContent>
        <Typography>CPU: {metrics?.cpuUsage.toFixed(1)}%</Typography>
        <Typography>Memory: {metrics?.memoryUsage.toFixed(1)}%</Typography>
        <Typography>Uptime: {formatUptime(metrics?.uptime)}</Typography>
        <Typography>Load Average: {metrics?.loadAverage?.join(", ")}</Typography>
      </CardContent>
    </Card>
  );
}
```

### Features
- 30-second polling interval
- WebSocket real-time updates (primary)
- API fallback for failed connections
- TypeScript safety
- Error handling

### Note
This hook is primarily a backup for WebSocket metrics. Prefer `useDashboardData` for dashboard use.

---

## useLoggerConfig

### Purpose
Fetch and manage logger configuration (levels, file logging, console logging).

### Returns

```typescript
interface UseLoggerConfigReturn {
  config: LoggerConfig | null;
  loading: boolean;
  error: string | null;
  updateConfig: (config: Partial<LoggerConfig>) => Promise<void>;
}

interface LoggerConfig {
  level: "debug" | "info" | "warn" | "error";
  consoleEnabled: boolean;
  fileEnabled: boolean;
  fileMaxSize: number;
  fileMaxFiles: number;
  websocketEnabled: boolean;
}
```

### Usage

```typescript
import { useLoggerConfig } from "@/hooks";

function LoggerSettings() {
  const { config, loading, updateConfig } = useLoggerConfig();

  const handleLevelChange = async (level: LogLevel) => {
    await updateConfig({ level });
    showNotification("Log level updated", "success");
  };

  if (loading) return <Loading />;

  return (
    <FormSection title="Logger Configuration">
      <FormField
        label="Log Level"
        name="level"
        type="select"
        value={config?.level}
        onChange={handleLevelChange}
        options={[
          { value: "debug", label: "Debug" },
          { value: "info", label: "Info" },
          { value: "warn", label: "Warning" },
          { value: "error", label: "Error" },
        ]}
      />
      {/* More fields */}
    </FormSection>
  );
}
```

### Features
- Fetch config from API
- Update config via API
- Real-time synchronization
- Validation via Zod

---

## useSettings

### Purpose
Manage application settings (theme, language, preferences).

### Returns

```typescript
interface UseSettingsReturn {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
}

interface AppSettings {
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  dateFormat: string;
  notificationsEnabled: boolean;
  autoRefreshInterval: number;
}
```

### Usage

```typescript
import { useSettings } from "@/hooks";

function SettingsPage() {
  const { settings, loading, updateSetting } = useSettings();

  const handleThemeChange = async (theme: ThemeMode) => {
    await updateSetting("theme", theme);
    showNotification("Theme updated", "success");
  };

  if (loading) return <Loading />;

  return (
    <FormSection title="Appearance">
      <FormSwitch
        label="Dark Mode"
        checked={settings.theme === "dark"}
        onChange={(e, checked) =>
          handleThemeChange(checked ? "dark" : "light")
        }
      />
      {/* More settings */}
    </FormSection>
  );
}
```

### Features
- Fetch settings from API
- Update settings with validation
- Reset to defaults
- Real-time synchronization
- Type-safe updates

---

## Common Patterns

### Hook Composition

```typescript
import { useFormState, useNotification, useDebouncedState } from "@/hooks";

function MyComponent() {
  const { values, setValue, errors, isSubmitting } = useFormState({
    name: "",
    email: "",
  });

  const { showNotification } = useNotification();

  const [debouncedEmail, setDebouncedEmail] = useDebouncedState(
    values.email,
    500
  );

  // Validate email after debounce
  useEffect(() => {
    if (debouncedEmail && !isValidEmail(debouncedEmail)) {
      setErrors({ email: "Invalid email format" });
    }
  }, [debouncedEmail]);

  const handleSubmit = async () => {
    try {
      await submitForm(values);
      showNotification("Form submitted", "success");
    } catch (error) {
      showNotification("Submission failed", "error");
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Error Handling with Hooks

```typescript
import { useDashboardActions, useNotification } from "@/hooks";

function Dashboard() {
  const { handleRefresh } = useDashboardActions();
  const { showNotification } = useNotification();

  const onRefresh = async () => {
    try {
      await handleRefresh();
      showNotification("Dashboard refreshed", "success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred";
      showNotification(message, "error");
    }
  };

  return <Button onClick={onRefresh}>Refresh</Button>;
}
```

### Real-Time Updates

```typescript
import { useDashboardData, useChartHistory } from "@/hooks";

function LiveDashboard() {
  const { metrics, connectionState } = useDashboardData();
  const chartHistory = useChartHistory();

  return (
    <>
      <StatusBadge status={connectionState} />
      <MetricCard value={metrics?.cpuUsage || 0} isDark={false} />
      <PerformanceChart data={chartHistory.cpu} title="CPU" />
    </>
  );
}
```

---

## Best Practices

### 1. Use Hooks for State Management

```typescript
// ✅ Good
const { values, setValue } = useFormState(initialValues);

// ❌ Bad
const [values, setValues] = useState(initialValues);
```

### 2. Handle Loading States

```typescript
const { loading, data } = useDashboardData();

if (loading) return <Loading />;
if (!data) return <EmptyState />;
return <Component data={data} />;
```

### 3. Cleanup Side Effects

```typescript
useEffect(() => {
  const interval = setInterval(refetch, 5000);
  return () => clearInterval(interval);
}, []);
```

### 4. Provide User Feedback

```typescript
const { showNotification } = useNotification();

const handleAction = async () => {
  try {
    await action();
    showNotification("Success!", "success");
  } catch (error) {
    showNotification("Failed", "error");
  }
};
```

### 5. Use TypeScript Generics

```typescript
interface MyData {
  id: number;
  name: string;
}

const { values, setValue } = useFormState<MyData>({
  id: 0,
  name: "",
});
```

---

## Performance Considerations

### 1. Debounce Expensive Operations

```typescript
const [value, setValue, debouncedValue] = useDebouncedState("", 300);

useEffect(() => {
  // Only run every 300ms
  performExpensiveOperation(debouncedValue);
}, [debouncedValue]);
```

### 2. Use Chart History Batching

```typescript
// Automatic batching by useChartHistory
// Updates happen every 5 seconds, not on every metric change
```

### 3. Leverage React Query Caching

```typescript
// useDashboardData uses React Query
// Data is cached and automatically invalidated
```

---

## Dependencies Summary

| Hook | External Dependencies | Internal Dependencies |
|------|---------------------|---------------------|
| useFormState | React useState, useCallback, useRef | None |
| useNotification | React useState, useCallback | None |
| useDebouncedState | React useState, useCallback, useRef, useEffect | None |
| useDashboardData | useWebSocket, useApi, React useEffect | useWebSocket, useApi |
| useDashboardActions | React useCallback, @tanstack/react-query | apiService, apiClient |
| useChartHistory | React hooks, Zustand store | useStore |
| useSystemMetrics | React hooks | None |
| useLoggerConfig | React hooks | None |
| useSettings | React hooks | None |

---

## See Also

- [UI Components](../components/ui/README.md)
- [Dashboard Components](../components/dashboard/README.md)
- [Form Components](../components/forms/README.md)
- [Component Library Overview](../components/README.md)
