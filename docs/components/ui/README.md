# UI Components

Comprehensive guide for all reusable UI components in the component library.

## Table of Contents

- [ThemedCard](#themedcard)
- [FormSwitch](#formswitch)
- [FormField](#formfield)
- [FormSection](#formsection)
- [WithLoading](#withloading)
- [StatusBadge](#statusbadge)
- [SliderField](#sliderfield)
- [FormTooltip](#formtooltip)
- [ErrorBoundary](#errorboundary)
- [MultiSelect](#multiselect)
- [Button](#button)
- [MetricsCard](#metricscard)
- [Loading](#loading)
- [SkeletonLoader](#skeletonloader)
- [BaseDialog](#basedialog)

---

## ThemedCard

### Purpose
Card component with automatic dark mode styling and multiple variants.

### Props

```typescript
interface ThemedCardProps {
  children: ReactNode;
  variant?: "default" | "gradient" | "glass";
  className?: string;
  sx?: object;
}
```

### Usage

```typescript
import { ThemedCard } from "@/components/ui";

function Example() {
  return (
    <ThemedCard variant="gradient">
      <p>Card content</p>
    </ThemedCard>
  );
}
```

### Variants
- **default**: Solid background with border
- **gradient**: Gradient background with elevated shadow
- **glass**: Glassmorphism effect with backdrop blur

### Dependencies
- ThemeContext (`isDark`)

---

## FormSwitch

### Purpose
Styled switch (toggle) with label, helper text, and optional tooltip.

### Props

```typescript
interface FormSwitchProps extends Omit<SwitchProps, "onChange"> {
  label?: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  disabled?: boolean;
  helperText?: string;
  tooltip?: string;
}
```

### Usage

```typescript
import FormSwitch from "@/components/ui/FormSwitch";

function Example() {
  const [enabled, setEnabled] = useState(false);

  return (
    <FormSwitch
      label="Enable GPU"
      checked={enabled}
      onChange={(e, checked) => setEnabled(checked)}
      helperText="Use GPU for faster inference"
      tooltip="GPU acceleration requires compatible hardware"
    />
  );
}
```

### Features
- Helper text below label
- Optional tooltip via FormTooltip
- Disabled state support

### Dependencies
- FormTooltip

---

## FormField

### Purpose
Generic form field wrapper supporting text, number, select, and boolean inputs.

### Props

```typescript
interface FormFieldProps {
  label: string;
  name: string;
  value: string | number | boolean;
  onChange: (name: string, value: string | number | boolean) => void;
  error?: string;
  helperText?: string;
  tooltip?: TooltipContent;
  type?: "text" | "number" | "select" | "boolean";
  options?: Array<{ value: string | number; label: string }>;
  fullWidth?: boolean;
}
```

### Usage

```typescript
import { FormField } from "@/components/ui";

function Example() {
  const [value, setValue] = useState("");

  return (
    <>
      {/* Text field */}
      <FormField
        label="Server Host"
        name="host"
        value={value}
        onChange={(name, val) => setValue(val)}
        helperText="Enter hostname or IP address"
      />

      {/* Select field */}
      <FormField
        label="Port"
        name="port"
        type="select"
        value={8080}
        onChange={handleChange}
        options={[
          { value: 8080, label: "8080" },
          { value: 9000, label: "9000" },
        ]}
      />

      {/* Boolean field */}
      <FormField
        label="Enable SSL"
        name="ssl"
        type="boolean"
        value={false}
        onChange={handleChange}
      />
    </>
  );
}
```

### Features
- Unified interface for multiple input types
- Error handling and validation feedback
- Tooltip integration
- Helper text support

### Dependencies
- FormTooltip

---

## FormSection

### Purpose
Group form fields into labeled sections with optional dividers.

### Props

```typescript
interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  spacing?: number;
  divider?: boolean;
}
```

### Usage

```typescript
import { FormSection, FormField } from "@/components/ui";
import { Settings } from "@mui/icons-material";

function Example() {
  return (
    <FormSection title="Server Configuration" icon={<Settings />} spacing={2}>
      <FormField label="Host" name="host" value={host} onChange={handleChange} />
      <FormField label="Port" name="port" value={port} onChange={handleChange} />
    </FormSection>
  );
}
```

### Features
- Automatic divider between sections
- Icon support for section headers
- Configurable spacing

---

## WithLoading

### Purpose
Wrapper component for loading states with multiple variants.

### Props

```typescript
interface WithLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: "skeleton" | "spinner" | "overlay";
  sx?: BoxProps["sx"];
}
```

### Usage

```typescript
import { WithLoading } from "@/components/ui";

function Example() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Spinner variant (default)
  return (
    <WithLoading loading={loading}>
      <MyComponent data={data} />
    </WithLoading>
  );

  // Skeleton variant
  return (
    <WithLoading loading={loading} variant="skeleton">
      <MyComponent data={data} />
    </WithLoading>
  );

  // Overlay variant (content visible with loading overlay)
  return (
    <WithLoading loading={loading} variant="overlay">
      <MyComponent data={data} />
    </WithLoading>
  );

  // Custom fallback
  return (
    <WithLoading loading={loading} fallback={<CustomLoadingSpinner />}>
      <MyComponent data={data} />
    </WithLoading>
  );
}
```

### Variants
- **spinner**: Circular progress indicator
- **skeleton**: Linear progress bar
- **overlay**: Content with loading overlay and backdrop blur

---

## StatusBadge

### Purpose
Display status information with color-coded badges and loading indicators.

### Props

```typescript
interface StatusBadgeProps {
  status: "running" | "idle" | "loading" | "error" | "stopped";
  size?: "small" | "medium" | "large";
  label?: string;
}
```

### Usage

```typescript
import { StatusBadge } from "@/components/ui";

function Example() {
  return (
    <div>
      <StatusBadge status="running" />
      <StatusBadge status="loading" size="small" />
      <StatusBadge status="error" label="Connection Failed" />
      <StatusBadge status="stopped" size="large" />
    </div>
  );
}
```

### Status Colors
- **running**: Success (green)
- **idle**: Default (gray)
- **loading**: Info (blue) with spinner
- **error**: Error (red)
- **stopped**: Warning (orange)

---

## SliderField

### Purpose
Slider input with value display, optional marks, and tooltip description.

### Props

```typescript
interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
  marks?: Array<{ value: number; label: string }>;
  unit?: string;
}
```

### Usage

```typescript
import SliderField from "@/components/ui/SliderField";

function Example() {
  const [temperature, setTemperature] = useState(0.7);

  return (
    <SliderField
      label="Temperature"
      value={temperature}
      onChange={setTemperature}
      min={0}
      max={2}
      step={0.1}
      description="Controls randomness in generation"
      marks={[
        { value: 0, label: "0" },
        { value: 1, label: "1" },
        { value: 2, label: "2" },
      ]}
      unit=""
    />
  );
}
```

### Features
- Real-time value display
- Unit suffix support
- Tooltip description
- Optional marks

---

## FormTooltip

### Purpose
Rich tooltip component for form fields with structured content.

### Props

```typescript
interface FormTooltipProps {
  content: TooltipContent;
  size?: "small" | "medium";
  placement?: TooltipProps["placement"];
  enterDelay?: number;
  enterNextDelay?: number;
  leaveDelay?: number;
  children?: React.ReactNode;
}

interface TooltipContent {
  title: string;
  description: string;
  recommendedValue?: string;
  effectOnModel?: string;
  whenToAdjust?: string;
}
```

### Usage

```typescript
import { FormTooltip, FieldWithTooltip, LabelWithTooltip } from "@/components/ui/FormTooltip";

// Standalone tooltip icon
<FormTooltip
  content={{
    title: "Temperature",
    description: "Controls randomness in text generation",
    recommendedValue: "0.7",
    effectOnModel: "Higher values increase creativity",
    whenToAdjust: "When responses are too predictable",
  }}
/>

// With field
<FieldWithTooltip
  content={{ title: "Host", description: "Server hostname or IP" }}
>
  <TextField name="host" />
</FieldWithTooltip>

// With label
<LabelWithTooltip
  label="Port"
  content={{ title: "Port", description: "Server port number" }}
  required
>
```

### Content Sections
- **title**: Bold heading
- **description**: Main explanatory text
- **recommendedValue**: Highlighted in green
- **effectOnModel**: Highlighted in blue
- **whenToAdjust**: Highlighted in orange

---

## ErrorBoundary

### Purpose
Class component for catching and handling React errors gracefully.

### Props

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

### Usage

```typescript
import { ErrorBoundary } from "@/components/ui";

function Example() {
  return (
    <ErrorBoundary
      fallback={<CustomErrorFallback />}
      onError={(error, errorInfo) => {
        console.error("Error caught:", error);
        // Log to error tracking service
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Features
- Automatic error catching
- Custom fallback UI
- Error callback for logging
- Development mode error details
- Ignores non-critical errors (ResizeObserver, hydration, etc.)

### Non-Critical Errors Ignored
- ResizeObserver loop limit exceeded
- Text content hydration mismatch
- Chunk loading errors
- Context provider errors

---

## MultiSelect

### Purpose
Multi-select dropdown with checkboxes, select all, and chip display.

### Props

```typescript
interface MultiSelectProps<T = string> {
  label?: string;
  options: MultiSelectOption<T>[];
  selected: Set<T>;
  onChange: (selected: Set<T>) => void;
  sx?: SxProps;
  placeholder?: string;
  disabled?: boolean;
  showSelectAll?: boolean;
  maxSelectedDisplay?: number;
  displayAllWhenFull?: boolean;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

interface MultiSelectOption<T = string> {
  value: T;
  label: string;
  color?: string;
}
```

### Usage

```typescript
import { MultiSelect } from "@/components/ui";

function Example() {
  const [selected, setSelected] = useState(new Set(["debug", "info"]));

  return (
    <MultiSelect
      options={[
        { value: "debug", label: "Debug", color: "#64748b" },
        { value: "info", label: "Info", color: "#3b82f6" },
        { value: "warn", label: "Warning", color: "#f59e0b" },
        { value: "error", label: "Error", color: "#ef4444" },
      ]}
      selected={selected}
      onChange={setSelected}
      placeholder="Select log levels..."
      maxSelectedDisplay={2}
      showSelectAll
    />
  );
}
```

### Features
- Chip display for selected items
- "Select All" / "Deselect All" option
- Custom colors per option
- Configurable max display count

---

## Button

### Purpose
Themed button component with multiple variants.

### Props

```typescript
interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}
```

### Usage

```typescript
import { Button } from "@/components/ui";

function Example() {
  return (
    <div>
      <Button variant="default" onClick={handleClick}>
        Default Button
      </Button>
      <Button variant="primary" onClick={handleClick}>
        Primary Action
      </Button>
      <Button variant="outline" onClick={handleClick}>
        Outline
      </Button>
      <Button variant="ghost" onClick={handleClick}>
        Ghost
      </Button>
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    </div>
  );
}
```

### Variants
- **default**: Solid primary color
- **primary**: Gradient primary
- **secondary**: Gradient secondary
- **outline**: Border with hover background
- **ghost**: Transparent with hover background

---

## MetricsCard

### Purpose
Display multiple system metrics in a grid layout with progress bars.

### Usage

```typescript
import { MetricsCard } from "@/components/ui";

function Example() {
  return <MetricsCard />;
}
```

### Metrics Displayed
- CPU Usage
- Memory Usage
- Available Models
- Average Response Time
- Total Requests

### Features
- Framer Motion animations
- Responsive grid layout
- Theme-aware styling
- Progress bars with color coding

---

## Loading

### Purpose
Full-page or inline loading indicators with multiple variants.

### Props

```typescript
interface LoadingProps {
  message?: string;
  variant?: "circular" | "linear" | "skeleton";
  fullPage?: boolean;
  size?: number;
}
```

### Usage

```typescript
import { Loading } from "@/components/ui";

function Example() {
  // Inline circular
  return <Loading message="Loading..." />;

  // Full page
  return <Loading message="Initializing..." fullPage variant="circular" />;

  // Linear progress
  return <Loading variant="linear" size={60} />;
}
```

---

## SkeletonLoader

### Purpose
Multiple skeleton loading components for different content types.

### Components

#### SkeletonCard
```typescript
interface SkeletonCardProps {
  count?: number;
  height?: number;
}
```

#### SkeletonMetricCard
```typescript
interface SkeletonMetricCardProps {
  icon?: string;
}
```

#### SkeletonTableRow
```typescript
interface SkeletonTableRowProps {
  rows?: number;
  columns?: number;
}
```

#### SkeletonLogEntry
```typescript
interface SkeletonLogEntryProps {
  count?: number;
}
```

#### SkeletonSettingsForm
```typescript
interface SkeletonSettingsFormProps {
  fields?: number;
}
```

### Usage

```typescript
import {
  SkeletonCard,
  SkeletonMetricCard,
  SkeletonTableRow,
  SkeletonLogEntry,
  SkeletonSettingsForm,
} from "@/components/ui/loading";

function Example() {
  return (
    <>
      <SkeletonCard count={3} height={200} />
      <SkeletonMetricCard icon="📊" />
      <SkeletonTableRow rows={5} columns={4} />
      <SkeletonLogEntry count={10} />
      <SkeletonSettingsForm fields={8} />
    </>
  );
}
```

---

## BaseDialog

### Purpose
Reusable dialog wrapper with optional default actions.

### Props

```typescript
interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: DialogProps["maxWidth"];
  showDefaultActions?: boolean;
  onSave?: () => void | Promise<void>;
  saveDisabled?: boolean;
  isSaving?: boolean;
  saveText?: string;
  cancelText?: string;
}
```

### Usage

```typescript
import { BaseDialog } from "@/components/ui/dialogs";

function Example() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await saveData();
    setSaving(false);
    setOpen(false);
  };

  return (
    <BaseDialog
      open={open}
      onClose={() => setOpen(false)}
      title="Settings"
      showDefaultActions
      onSave={handleSave}
      isSaving={saving}
      saveDisabled={false}
      saveText="Save Changes"
      cancelText="Cancel"
    >
      <DialogContent>
        {/* Dialog content */}
      </DialogContent>
    </BaseDialog>
  );
}
```

### Features
- Default Save/Cancel actions
- Loading state support
- Configurable max width
- Async save handling

---

## Best Practices

### 1. Consistent Spacing
Use Material-UI spacing scale (multiples of 8px):
```typescript
sx={{ p: 2, m: 1, gap: 2 }}
```

### 2. Dark Mode
All components automatically adapt. Test in both themes:
```typescript
// Theme context available for custom styling
const { isDark } = useTheme();
```

### 3. Loading States
Always provide loading feedback:
```typescript
<WithLoading loading={isLoading}>
  <Component />
</WithLoading>
```

### 4. Error Handling
Wrap error-prone components:
```typescript
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

### 5. Accessibility
Include ARIA labels:
```typescript
<Button ariaLabel="Refresh data">Refresh</Button>
```

## Migration Guide

### From Standard MUI Components

#### TextField → FormField
```typescript
// Old
<TextField label="Name" value={name} onChange={e => setName(e.target.value)} />

// New
<FormField
  label="Name"
  name="name"
  value={name}
  onChange={(name, val) => setName(val)}
/>
```

#### Switch → FormSwitch
```typescript
// Old
<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />

// New
<FormSwitch
  label="Enable"
  checked={enabled}
  onChange={(e, checked) => setEnabled(checked)}
/>
```

## Dependencies Summary

| Component | External Dependencies | Internal Dependencies |
|-----------|---------------------|---------------------|
| ThemedCard | MUI Card, Box | ThemeContext |
| FormSwitch | MUI Switch | FormTooltip |
| FormField | MUI TextField, Select, Checkbox | FormTooltip |
| FormSection | MUI Grid, Typography, Divider | None |
| WithLoading | MUI Box, CircularProgress, LinearProgress | None |
| StatusBadge | MUI Chip, CircularProgress | None |
| SliderField | MUI Slider, Tooltip | None |
| FormTooltip | MUI Tooltip, IconButton | None |
| ErrorBoundary | MUI Alert, Card | None |
| MultiSelect | MUI Select, Checkbox, Chip | None |
| Button | None | None |
| MetricsCard | MUI Card, Grid, LinearProgress | useStore, ThemeContext |
| Loading | MUI Box, CircularProgress, LinearProgress | ThemeContext |
| SkeletonLoader | MUI Skeleton, Box | ThemeContext |
| BaseDialog | MUI Dialog, Button | None |

## See Also

- [Dashboard Components](../dashboard/README.md)
- [Form Components](../forms/README.md)
- [Custom Hooks](../../hooks/README.md)
- [Component Library Overview](../README.md)
