# ModelConfigDialog - Quick Reference Guide

## Quick Start

### Import the Improved Component

```tsx
import ModelConfigDialog from "@/components/ui/ModelConfigDialogImproved";
```

### Basic Usage

```tsx
const [open, setOpen] = useState(false);
const [configType, setConfigType] = useState<ConfigType | null>("sampling");
const [config, setConfig] = useState({ temperature: 0.7, top_k: 40 });

<ModelConfigDialog
  open={open}
  modelId={modelId}
  configType={configType}
  config={config}
  onClose={() => setOpen(false)}
  onSave={(newConfig) => setConfig(newConfig)}
/>
```

## Key Features

### 1. Slider Controls
Numeric parameters with validation rules get automatic sliders:

```typescript
{
  name: "temperature",
  label: "Temperature",
  type: "slider",
  defaultValue: 0.7,
  validation: {
    min: 0,
    max: 2,
    step: 0.01,
    description: "Controls randomness",
    unit: ""
  }
}
```

### 2. Accordion Groups
Parameters are grouped by `group` property:

```typescript
{
  name: "top_k",
  group: "Core Sampling",
  // ...
}
```

Groups can be collapsed/expanded for better organization.

### 3. Validation
Automatic validation for numeric parameters:

- Min/max checking
- Type validation
- Real-time feedback
- Error messages

### 4. Responsive Design
- **Mobile**: Stacked layout, full-width fields
- **Tablet**: 2-column layout
- **Desktop**: 2-3 column layout

## Config Types

### Available Config Types

```typescript
type ConfigType =
  | "sampling"    // Temperature, top_p, top_k, repetition control
  | "memory"      // Cache, mmap, mlock, memory management
  | "gpu"         // GPU layers, split mode, multi-GPU
  | "advanced"     // Context shift, flash attention, debugging
  | "lora"        // LoRA adapters, speculative decoding
  | "multimodal";  // MMPROJ, image tokens
```

### Parameter Group Examples

#### Sampling Parameters
- **Core Sampling**: Temperature, Top K, Top P, Min P
- **Repetition Control**: Repeat Penalty, Repeat Last N, Presence/Frequency Penalty
- **DRY Parameters**: DRY Multiplier, DRY Base
- **Mirostat**: Mode, Learning Rate, Entropy
- **Output Control**: Seed, Ignore EOS, Escape

#### Memory Parameters
- **Cache Settings**: Cache RAM
- **Memory Management**: MMap, MLock
- **Performance**: Defrag Threshold

#### GPU Parameters
- **GPU Settings**: GPU Layers
- **Multi-GPU**: Split Mode, Main GPU
- **Performance**: KV Offload

## Customization

### Add New Parameters

Add to `configFields` object:

```typescript
sampling: [
  {
    name: "custom_param",
    label: "Custom Parameter",
    type: "slider", // "text" | "number" | "select" | "boolean" | "slider"
    defaultValue: 0.5,
    size: { xs: 12, sm: 6, md: 4 },
    group: "Custom Group",
    description: "Parameter description",
    validation: {
      min: 0,
      max: 1,
      step: 0.01,
      unit: ""
    }
  }
]
```

### Field Types

#### Slider
```typescript
{
  type: "slider",
  validation: { min, max, step, unit }
}
```

#### Number
```typescript
{
  type: "number",
  validation: { min, max, step, unit }
}
```

#### Select
```typescript
{
  type: "select",
  options: ["option1", "option2"]
}
```

#### Boolean
```typescript
{
  type: "boolean",
  description: "Description text"
}
```

#### Text
```typescript
{
  type: "text",
  description: "Description text"
}
```

## Styling

### Theme Integration
Component automatically uses app theme:

```tsx
// Dark mode
<ThemeProvider theme="dark">
  <ModelConfigDialog />
</ThemeProvider>

// Light mode
<ThemeProvider theme="light">
  <ModelConfigDialog />
</ThemeProvider>
```

### Custom Styling
Use sx prop on Dialog:

```tsx
<ModelConfigDialog
  sx={{
    // Custom styles
  }}
  // ...other props
/>
```

## State Management

### Handle Changes

```tsx
const handleSave = (newConfig: any) => {
  // Save to backend
  await updateModelConfig(modelId, configType, newConfig);

  // Update local state
  setConfig(newConfig);
};
```

### Reset to Defaults

The component includes a "Reset to Defaults" button that restores default values defined in `configFields`.

### Change Detection

The component tracks changes and disables save button until changes are made:

```tsx
const [hasChanges, setHasChanges] = useState(false);

// Component automatically tracks changes
// Save button: disabled={!hasChanges}
```

## Validation

### Client-Side Validation

Automatic validation for numeric parameters with `validation` rule:

```typescript
validation: {
  min: 0,
  max: 2,
  step: 0.01
}
```

### Error Display

Errors are displayed inline with fields:

```tsx
<TextField
  error={!!errors[field.name]}
  helperText={errors[field.name] || field.description}
/>
```

### Prevent Invalid Saves

Save button is disabled if validation errors exist:

```tsx
<Button
  onClick={handleSave}
  disabled={!hasChanges || hasValidationErrors}
>
  Save Configuration
</Button>
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate between fields
- **Shift+Tab**: Navigate backwards
- **Escape**: Close dialog
- **Enter**: Save (when focused on save button)
- **Arrow keys**: Slider values

### Screen Reader Support
- Proper ARIA labels
- Semantic HTML
- Description text available
- Focus management

### Focus Management
- First field auto-focused when dialog opens
- Proper tab order
- Visible focus indicators

## Responsive Behavior

### Breakpoints
- **xs** (< 600px): Full-width fields, stacked actions
- **sm** (600-900px): 2-column grid
- **md** (900-1200px): 2-3 column grid
- **lg** (1200px+): 3-column grid

### Dialog Sizing
```tsx
<Dialog
  maxWidth={isMobile ? "md" : "lg"}  // Smaller on mobile
  fullWidth
>
```

## Performance

### Optimizations
- Accordion uses `unmountOnExit={false}` for smooth transitions
- Validation only runs on field change
- Grouped fields reduce re-renders
- Memoized components for expensive renders

### Best Practices
- Keep field count per group reasonable (< 20 fields)
- Use slider for common numeric adjustments
- Use accordion for infrequently accessed parameters
- Add descriptions for complex parameters

## Common Patterns

### Toggle Slider Mode
Users can toggle between slider and number input:

```tsx
<IconButton onClick={() => toggleSliderMode(fieldName)}>
  <KeyboardIcon />
</IconButton>
```

### Group with Icon
Groups have semantic icons:

```tsx
const getGroupIcon = (groupName: string) => {
  switch (groupName.toLowerCase()) {
    case "core sampling":
      return <SpeedIcon color="primary" />;
    case "gpu settings":
      return <MemoryIcon color="primary" />;
    // ...
  }
};
```

### Value Display
Sliders show formatted values:

```tsx
<Typography
  variant="body2"
  fontWeight={600}
  sx={{ fontFamily: "monospace" }}
>
  {value.toFixed(validation.step < 1 ? 2 : 0)}
  {validation.unit}
</Typography>
```

## Troubleshooting

### Issue: Slider not showing for numeric parameter
**Solution**: Ensure field type is `"slider"` and validation.min/max are defined.

### Issue: Validation errors not showing
**Solution**: Check that `validation` object has proper min/max/step values.

### Issue: Dialog too small on mobile
**Solution**: The component uses responsive sizing. If still too small, adjust breakpoints.

### Issue: Dark mode colors incorrect
**Solution**: Ensure ThemeProvider is wrapping the component with proper theme.

## Migration from Old Component

### Step 1: Update Import
```tsx
// Old
import ModelConfigDialog from "@/components/ui/ModelConfigDialog";

// New
import ModelConfigDialog from "@/components/ui/ModelConfigDialogImproved";
```

### Step 2: Update Config Fields (Optional)
Add new properties to field definitions:

```typescript
{
  // Old
  name: "temperature",
  label: "Temperature",
  type: "number",
  defaultValue: 0.7
}

// New
  name: "temperature",
  label: "Temperature",
  type: "slider",
  defaultValue: 0.7,
  group: "Core Sampling",
  description: "Controls randomness",
  validation: { min: 0, max: 2, step: 0.01 }
}
```

### Step 3: Test
Test all config types and parameter groups.

## Best Practices

1. **Group Related Parameters**: Use meaningful group names
2. **Provide Descriptions**: Help users understand parameters
3. **Set Appropriate Defaults**: Use sensible default values
4. **Validate Ranges**: Prevent invalid values
5. **Use Sliders**: For commonly adjusted numeric parameters
6. **Test Accessibility**: Verify keyboard navigation works
7. **Test Responsive**: Check on different screen sizes
8. **Provide Context**: Explain what parameters do

## Examples

### Complete Field Definition

```typescript
{
  name: "temperature",
  label: "Temperature",
  type: "slider",
  defaultValue: 0.7,
  size: { xs: 12, sm: 6, md: 4 },
  group: "Core Sampling",
  description: "Controls randomness in generation. Lower = more deterministic, Higher = more creative",
  validation: {
    min: 0,
    max: 2,
    step: 0.01,
    unit: ""
  }
}
```

### Boolean Switch with Description

```typescript
{
  name: "ignore_eos",
  label: "Ignore EOS",
  type: "boolean",
  defaultValue: false,
  size: { xs: 12, sm: 6 },
  group: "Output Control",
  description: "Ignore end-of-sequence token in output"
}
```

### Select with Options

```typescript
{
  name: "mirostat",
  label: "Mirostat Mode",
  type: "select",
  options: ["0", "1", "2"],
  defaultValue: "0",
  size: { xs: 12, sm: 6 },
  group: "Mirostat",
  description: "Mirostat algorithm: 0=disabled, 1=Mirostat, 2=Mirostat 2.0"
}
```

## Resources

- **Design Doc**: `MODELCONFIGDIALOG_UI_IMPROVEMENTS.md`
- **Implementation Summary**: `MODELCONFIGDIALOG_IMPROVEMENTS_SUMMARY.md`
- **Component**: `src/components/ui/ModelConfigDialogImproved.tsx`
- **MUI v7 Docs**: https://mui.com/material-ui/
- **React 19.2 Docs**: https://react.dev/

## Support

For issues or questions:
1. Check this quick reference
2. Read the detailed design document
3. Review component code comments
4. Check MUI documentation
5. Consult React documentation

---

**Last Updated**: 2025
**Component Version**: Improved v2.0
**MUI Version**: v7.x
**React Version**: 19.2
