# Modular Architecture Guide

This document outlines the new modular structure and how to use it.

## Core Principles

1. **Single Responsibility**: Each module does one thing well
2. **Loose Coupling**: Modules are independent and composable
3. **High Cohesion**: Related functionality is grouped together
4. **Clear Boundaries**: Public APIs are explicit via exports

---

## Configuration Module

### Location
`src/components/configuration/`

### Main Exports
```typescript
import ModernConfiguration from '@/components/configuration/ModernConfiguration';
import { useConfigurationForm } from '@/components/configuration/hooks/useConfigurationForm';
import { DEFAULT_LLAMA_SERVER_CONFIG } from '@/config/llama-defaults';
```

### Component Hierarchy
```
ModernConfiguration (orchestrator)
├── ConfigurationHeader (static)
├── ConfigurationTabs (selector)
├── ConfigurationStatusMessages (feedback)
├── GeneralSettingsTab (form)
├── LlamaServerSettingsTab (form)
├── AdvancedSettingsTab (actions)
└── ConfigurationActions (buttons)
```

### Usage Example
```typescript
import ModernConfiguration from '@/components/configuration/ModernConfiguration';

export default function ConfigPage() {
  return <ModernConfiguration />;
}
```

### Extending with New Settings

1. Add to `DEFAULT_LLAMA_SERVER_CONFIG` in `src/config/llama-defaults.ts`
2. Create new Tab component (e.g., `NewFeatureTab.tsx`)
3. Import in `ModernConfiguration.tsx`
4. Add tab logic in `useConfigurationForm.ts`

---

## LlamaService Module

### Location
`src/server/services/llama/`

### Main Exports
```typescript
import { LlamaService, LlamaServerConfig, LlamaServiceState } from '@/server/services/llama/LlamaService';

// Or via barrel export
import { LlamaService } from '@/server/services';
```

### Class Hierarchy
```
LlamaService (public API)
├── ProcessManager (private: child process)
├── HealthChecker (private: health checks)
├── ModelLoader (private: model discovery)
├── ArgumentBuilder (static: arg building)
├── StateManager (private: state)
├── Logger (private: logging)
└── RetryHandler (private: retry logic)
```

### Usage Example
```typescript
const config: LlamaServerConfig = {
  host: '127.0.0.1',
  port: 8080,
  basePath: '/models',
  // ... other options
};

const service = new LlamaService(config);

// Start the service
await service.start();

// Listen for state changes
service.onStateChange((state) => {
  console.log('Status:', state.status);
  console.log('Models:', state.models);
});

// Stop the service
await service.stop();
```

### Key Methods
```typescript
async start(): Promise<void>         // Start llama server
async stop(): Promise<void>          // Stop llama server
getState(): LlamaServiceState        // Get current state
onStateChange(callback): void        // Register state listener
```

### State Management
The `StateManager` handles:
- Status transitions (initial → starting → ready → stopping)
- Model list updates
- Retry counter
- Uptime tracking
- State change callbacks

### Process Management
The `ProcessManager` handles:
- Spawning child process
- Capturing stdout/stderr
- Graceful shutdown (SIGTERM → SIGKILL)
- Error/exit event handling

### Health Checking
The `HealthChecker` handles:
- HTTP health endpoint checks
- Retry logic with configurable intervals
- Timeout handling

### Model Loading
The `ModelLoader` handles:
- Loading from llama-server /models endpoint
- Filesystem fallback (scanning for .gguf/.bin files)
- Model metadata extraction

---

## Dashboard Module

### Location
`src/components/dashboard/`

### Main Exports
```typescript
import ModernDashboard from '@/components/dashboard/ModernDashboard';
import { useDashboardMetrics } from '@/components/dashboard/hooks/useDashboardMetrics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { GpuPerformanceSection } from '@/components/dashboard/GpuPerformanceSection';
```

### Component Hierarchy
```
ModernDashboard (orchestrator)
├── DashboardHeader (static: title & status)
├── MetricsCard (component: key metrics)
├── GpuPerformanceSection (section)
│   ├── GpuMetricsCard (4x reusable)
├── SystemPerformanceChart (section: CPU/Memory)
├── SystemInfoCard (section: system status)
├── GpuPerformanceChart (section: history)
├── ModelsSection (section: available models)
└── ActivitySection (section: recent logs)
```

### Usage Example
```typescript
import ModernDashboard from '@/components/dashboard/ModernDashboard';

export default function DashboardPage() {
  return <ModernDashboard />;
}
```

### Custom Hook Usage
```typescript
import { useDashboardMetrics } from '@/components/dashboard/hooks/useDashboardMetrics';

function CustomMetricsComponent() {
  const { metrics, chartData, loading, isConnected } = useDashboardMetrics();
  
  return (
    <div>
      {loading ? 'Loading...' : `Connected: ${isConnected}`}
      {/* Use metrics, chartData */}
    </div>
  );
}
```

### Creating New Dashboard Sections

1. Create component: `src/components/dashboard/NewSection.tsx`
2. Follow the interface pattern:
   ```typescript
   interface NewSectionProps {
     data: any;
   }
   
   export function NewSection({ data }: NewSectionProps) {
     return <m.div>{/* content */}</m.div>;
   }
   ```
3. Import in `ModernDashboard.tsx`
4. Add to render with proper spacing/ordering

---

## Shared Utilities

### Configuration
```typescript
import { DEFAULT_LLAMA_SERVER_CONFIG } from '@/config/llama-defaults';
```

### Theme Context
```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { isDark } = useTheme();
```

### WebSocket Hook
```typescript
import { useWebSocket } from '@/hooks/use-websocket';

const { isConnected, requestMetrics } = useWebSocket();
```

### Store (Zustand)
```typescript
import { useStore } from '@/lib/store';

const metrics = useStore((state) => state.metrics);
const models = useStore((state) => state.models);
```

---

## Type Definitions

### LlamaServiceConfig
```typescript
interface LlamaServerConfig {
  host: string;                  // Server host (127.0.0.1)
  port: number;                  // Server port (8080)
  modelPath?: string;            // Specific model file
  basePath?: string;             // Models directory
  serverPath?: string;           // llama-server binary path
  ctx_size?: number;             // Context window
  gpu_layers?: number;           // GPU layers to use
  temperature?: number;          // Sampling temperature
  // ... 50+ more options
}
```

### LlamaServiceState
```typescript
interface LlamaServiceState {
  status: 'initial' | 'starting' | 'ready' | 'error' | 'crashed' | 'stopping';
  models: LlamaModel[];
  lastError: string | null;
  retries: number;
  uptime: number;
  startedAt: Date | null;
}
```

### ChartDataPoint
```typescript
interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  requests: number;
  gpu?: number;
  gpuMemory?: number;
  gpuPower?: number;
}
```

---

## Best Practices

### 1. Import Organization
```typescript
// Built-in modules
import { useState } from 'react';

// External packages
import { Box, Typography } from '@mui/material';

// Internal utilities
import { useTheme } from '@/contexts/ThemeContext';
import { LlamaService } from '@/server/services';

// Local components (relative imports for same directory)
import { ComponentName } from './ComponentName';
```

### 2. Component Composition
```typescript
// Instead of one large component
export function LargeComponent() {
  return (
    <HeaderComponent />
    <FormComponent />
    <ActionComponent />
  );
}
```

### 3. State Management
```typescript
// For local component state
const [value, setValue] = useState();

// For shared app state
const sharedValue = useStore((state) => state.value);

// For form state
const { formData, setFormData } = useFormHook();
```

### 4. Custom Hooks
```typescript
// Extract logic into reusable hooks
export function useFeature() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Logic here
  }, []);
  
  return { data, loading };
}
```

### 5. Styling
```typescript
// Use theme context for dark/light mode
const { isDark } = useTheme();

// Apply conditional styles
sx={{
  background: isDark ? 'dark' : 'light',
}}
```

---

## Migration Checklist

- [ ] Update all `ModernConfiguration` imports
- [ ] Update all `ModernDashboard` imports
- [ ] Update all `LlamaService` imports
- [ ] Test configuration page
- [ ] Test dashboard page
- [ ] Test server startup/shutdown
- [ ] Run full test suite
- [ ] Check bundle size changes

---

## Common Patterns

### Adding New Configuration Section
1. Create `NewSettingTab.tsx` in `src/components/configuration/`
2. Add state handlers in `useConfigurationForm.ts`
3. Add Tab in `ConfigurationTabs.tsx`
4. Render in `ModernConfiguration.tsx`

### Adding New Dashboard Chart
1. Create chart component in `src/components/dashboard/`
2. Extract metric calculations if needed
3. Use `useDashboardMetrics` hook for data
4. Import and render in `ModernDashboard.tsx`

### Adding New LlamaService Feature
1. Create feature manager: `src/server/services/llama/featureName.ts`
2. Inject into `LlamaService` constructor
3. Expose via public methods
4. Add tests for new feature

---

## Troubleshooting

### Import Path Issues
- Use `@/` prefix for absolute imports (configured in `tsconfig.json`)
- For sibling imports use relative paths: `./ComponentName`
- For parent imports: `../ComponentName`

### Type Errors
- Check that interfaces are exported from modules
- Verify type file locations match exports
- Use `// @ts-expect-error` only as last resort

### Module Not Found
- Check file extensions (.tsx, .ts)
- Verify exports match imports
- Check `package.json` path aliases

