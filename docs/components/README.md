# Component Library

## Overview

The Next.js Llama Async Proxy component library provides a comprehensive set of reusable UI components built with React 19.2, TypeScript, and Material-UI v8. All components follow a consistent design system, support dark mode, and are optimized for performance with memoization and lazy loading.

## Features

- **Type Safety**: Full TypeScript support with strict typing
- **Dark Mode**: Automatic theme adaptation via ThemeContext
- **Performance**: Memoized components using React.memo and useCallback
- **Accessibility**: ARIA labels and keyboard navigation support
- **Composability**: Designed for composition and reusability
- **Testing**: 98% coverage threshold with comprehensive test suites

## Architecture

```
src/components/
├── ui/              # Reusable UI components (15 components)
├── dashboard/       # Dashboard-specific components (9 components)
├── forms/           # Form components (5 components)
├── configuration/   # Configuration page components
├── layout/          # Layout components (Header, Sidebar)
├── pages/           # Page-level components
└── charts/          # Chart components
```

## Component Categories

### UI Components
- [ThemedCard](./ui/README.md) - Card with theme-aware styling
- [FormSwitch](./ui/README.md) - Switch with label and helper text
- [FormField](./ui/README.md) - Generic form field wrapper
- [FormSection](./ui/README.md) - Section grouping with title
- [WithLoading](./ui/README.md) - Loading state wrapper
- [StatusBadge](./ui/README.md) - Status display badge
- [SliderField](./ui/README.md) - Slider input with value display
- [FormTooltip](./ui/README.md) - Rich tooltip component
- [ErrorBoundary](./ui/README.md) - Error catching and display
- [MultiSelect](./ui/README.md) - Multi-select dropdown
- [Button](./ui/README.md) - Themed button variants
- [MetricsCard](./ui/README.md) - Metrics display card
- [Loading](./ui/README.md) - Loading indicator
- [SkeletonLoader](./ui/README.md) - Skeleton loading states
- [BaseDialog](./ui/README.md) - Dialog wrapper with actions

### Dashboard Components
- [MetricCard](./dashboard/README.md) - Performance metric card
- [CircularGauge](./dashboard/README.md) - Circular gauge chart
- [QuickActionsCard](./dashboard/README.md) - Server action buttons
- [MetricsGrid](./dashboard/README.md) - Metrics grid layout
- [ChartsSection](./dashboard/README.md) - Charts container
- [DashboardHeader](./dashboard/README.md) - Dashboard header
- [DashboardActions](./dashboard/README.md) - Dashboard action buttons
- [ServerStatusSection](./dashboard/README.md) - Server status display
- [GPUMetricsSection](./dashboard/README.md) - GPU metrics display

### Form Components
- [SamplingForm](./forms/README.md) - Sampling parameters form
- [MemoryForm](./forms/README.md) - Memory configuration form
- [GPUForm](./forms/README.md) - GPU settings form
- [AdvancedForm](./forms/README.md) - Advanced options form
- [LoRAForm](./forms/README.md) - LoRA adapter form

### Custom Hooks
- [useFormState](../hooks/README.md) - Form state management
- [useNotification](../hooks/README.md) - Notification/snackbar
- [useDebouncedState](../hooks/README.md) - Debounced state updates
- [useDashboardData](../hooks/README.md) - Dashboard data fetching
- [useDashboardActions](../hooks/README.md) - Dashboard action handlers
- [useChartHistory](../hooks/README.md) - Chart data management
- [useSystemMetrics](../hooks/README.md) - System metrics fetching
- [useLoggerConfig](../hooks/README.md) - Logger configuration
- [useSettings](../hooks/README.md) - Settings management

## Usage Patterns

### Basic Component Usage
```typescript
import { ThemedCard, StatusBadge, Button } from "@/components/ui";

function MyComponent() {
  return (
    <ThemedCard variant="default">
      <StatusBadge status="running" />
      <Button onClick={handleAction}>Submit</Button>
    </ThemedCard>
  );
}
```

### Using Custom Hooks
```typescript
import { useFormState, useNotification } from "@/hooks";

function MyForm() {
  const { values, setValue, errors, isSubmitting } = useFormState({
    name: "",
    email: "",
  });

  const { showNotification } = useNotification();

  const handleSubmit = async () => {
    await submitForm(values);
    showNotification("Success!", "success");
  };

  // ... form implementation
}
```

### Dark Mode Support
All components automatically adapt to dark mode through the ThemeContext:

```typescript
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { isDark } = useTheme();

  return (
    <ThemedCard>
      {/* Component styling adjusts automatically based on isDark */}
    </ThemedCard>
  );
}
```

## Best Practices

### 1. Component Composition
```typescript
// ✅ Good - Compose smaller components
<FormSection title="Server Settings">
  <FormField label="Host" name="host" value={host} onChange={onChange} />
  <FormSwitch label="Enable GPU" checked={enableGPU} onChange={setEnableGPU} />
</FormSection>

// ❌ Bad - Monolithic component
function BigForm() {
  // Hundreds of lines of form logic
}
```

### 2. Memoization
Use React.memo for expensive components:

```typescript
import { memo } from "react";

export const MetricCard = memo(function MetricCard({ value, threshold }) {
  // Expensive calculations here
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.value === nextProps.value;
});
```

### 3. Type Safety
Always use TypeScript interfaces for props:

```typescript
interface MyComponentProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function MyComponent({ value, onChange, disabled }: MyComponentProps) {
  // Implementation
}
```

### 4. Error Handling
Wrap components in ErrorBoundary:

```typescript
import { ErrorBoundary } from "@/components/ui";

<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

### 5. Loading States
Use WithLoading or Loading components for async operations:

```typescript
<WithLoading loading={isLoading}>
  <MyDataComponent data={data} />
</WithLoading>
```

## Performance Guidelines

### 1. Use Custom Memoization
- React.memo for component memoization
- useCallback for stable function references
- useMemo for expensive calculations

### 2. Lazy Loading
Code split large components:

```typescript
const HeavyComponent = lazy(() => import("./HeavyComponent"));
```

### 3. Debounce Expensive Operations
```typescript
const [debouncedValue, setDebouncedValue] = useDebouncedState(
  initialValue,
  300 // 300ms delay
);
```

## Testing

All components have comprehensive test coverage (98% threshold):

```bash
# Run component tests
pnpm test src/components/ui/MetricCard.test.tsx

# Run with coverage
pnpm test:coverage
```

## Migration Guide

### From Material-UI v6 to v8
```typescript
// ❌ Old (MUI v6)
<Grid item xs={12} sm={6} md={4}>

// ✅ New (MUI v8)
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
```

### Component Updates
See individual component documentation for specific migration instructions.

## Dependencies

### Core Dependencies
- React 19.2.3
- TypeScript 5.9.3
- @mui/material v8.3.6
- @mui/material-nextjs
- @mui/x-charts v8.23.0
- Framer Motion

### Internal Dependencies
- ThemeContext (dark mode)
- Zustand store (state)
- @tanstack/react-query (data fetching)
- Socket.IO (real-time updates)

## Contributing

When adding new components:

1. Follow the established folder structure
2. Use TypeScript with strict typing
3. Add comprehensive tests
4. Document props and usage
5. Ensure dark mode compatibility
6. Include error boundaries
7. Add loading states where appropriate

## License

MIT
