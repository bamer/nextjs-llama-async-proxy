# Tooltip System for Model Config Dialog

## Overview

The tooltip system provides contextual help for all model configuration parameters in the ModelConfigDialog. Each parameter has detailed explanations including what it does, recommended values, effects on model behavior, and when to adjust it.

## Components

### 1. FormTooltip Component

Located at: `src/components/ui/FormTooltip.tsx`

A flexible tooltip component that displays rich, formatted content with multiple sections.

```tsx
import { FormTooltip } from "@/components/ui/FormTooltip";
import { getTooltipContent } from "@/config/tooltip-config";

<FormTooltip content={getTooltipContent("sampling", "temperature")} />
```

**Props:**
- `content`: TooltipContent - The tooltip content object
- `size`: "small" | "medium" - Controls font size (default: medium)
- `placement`: TooltipProps["placement"] - Position (default: right)
- `enterDelay`: number - Delay before showing tooltip (default: 500ms)
- `enterNextDelay`: number - Delay for subsequent tooltips (default: 500ms)
- `children`: React.ReactNode - Optional child element to wrap

### 2. FieldWithTooltip Component

Wraps form fields with a tooltip and adds an info icon.

```tsx
<FieldWithTooltip content={tooltipContent}>
  <TextField label="Temperature" />
</FieldWithTooltip>
```

### 3. LabelWithTooltip Component

Adds tooltip inline with a label (for custom label implementations).

```tsx
<LabelWithTooltip label="Temperature" content={tooltipContent} required />
```

## Tooltip Content Structure

Located at: `src/config/tooltip-config.ts`

Each tooltip has four optional sections:

```typescript
interface TooltipContent {
  title: string;              // Parameter name
  description: string;         // What the parameter does
  recommendedValue?: string;   // Recommended values/ranges
  effectOnModel?: string;      // Effects on model behavior
  whenToAdjust?: string;       // When to adjust the parameter
}
```

## Configuration Object

The `tooltipConfig` object organizes tooltips by config type and field name:

```typescript
export const tooltipConfig: TooltipConfig = {
  sampling: {
    temperature: {
      title: "Temperature",
      description: "Controls randomness in token selection...",
      recommendedValue: "0.0 - 2.0 (default: 0.7)",
      effectOnModel: "Higher values increase creativity...",
      whenToAdjust: "Increase for creative writing...",
    },
    // ... more fields
  },
  memory: { /* ... */ },
  gpu: { /* ... */ },
  advanced: { /* ... */ },
  lora: { /* ... */ },
  multimodal: { /* ... */ },
};
```

## Integration with ModelConfigDialog

The ModelConfigDialog automatically shows tooltips for all fields that have tooltip content defined.

### How it works:

1. The `renderField` function retrieves tooltip content using `getTooltipContent(configType, field.name)`
2. If tooltip content exists, the field is wrapped in `FieldWithTooltip`
3. An info icon is automatically added next to each field
4. Hovering over the field or icon displays the tooltip

### Example usage in ModelConfigDialog:

```tsx
const renderField = (field: any) => {
  const value = editedConfig[field.name] ?? field.defaultValue;
  const tooltipContent = configType ? getTooltipContent(configType, field.name) : undefined;

  if (field.type === "number" && tooltipContent) {
    return (
      <FieldWithTooltip content={tooltipContent}>
        <TextField
          fullWidth
          size="small"
          label={field.label}
          type="number"
          value={value}
          onChange={(e) => handleFieldChange(field.name, Number.parseFloat(e.target.value) || 0)}
          variant="outlined"
        />
      </FieldWithTooltip>
    );
  }
  // ... handle other types
};
```

## Adding New Tooltips

To add tooltips for new parameters:

1. Edit `src/config/tooltip-config.ts`
2. Add the tooltip content under the appropriate config type:

```typescript
export const tooltipConfig: TooltipConfig = {
  sampling: {
    newParameter: {
      title: "New Parameter",
      description: "What this parameter does...",
      recommendedValue: "Recommended range...",
      effectOnModel: "How it affects the model...",
      whenToAdjust: "When you should adjust it...",
    },
  },
};
```

3. The tooltip will automatically appear when the field is rendered in ModelConfigDialog

## Styling

The tooltip system uses MUI v7 theming and follows these design principles:

- **Colors**:
  - Title: `primary.main`
  - Recommended values: `success.main`
  - Effect section: `info.main`
  - When to adjust section: `warning.main`

- **Typography**:
  - Title: Subtitle2 with bold weight
  - Description: Body2 with 1.5 line height
  - Labels: Caption with bold weight

- **Layout**:
  - Max width: 400px
  - Responsive spacing between sections
  - Arrow pointer for orientation

## Accessibility

- Proper ARIA labels on info icons: `aria-label="Info about {parameter name}"`
- Keyboard navigable tooltip triggers
- Delayed appearance to prevent accidental triggers
- High contrast colors for readability

## Customization

### Customizing Tooltip Appearance

```tsx
<FormTooltip
  content={tooltipContent}
  size="small"              // Smaller fonts
  placement="top"           // Show above instead of right
  enterDelay={300}          // Faster appearance
  enterNextDelay={200}      // Faster subsequent tooltips
>
  <TextField />
</FormTooltip>
```

### Using Just the Info Icon

```tsx
<Box>
  <TextField label="Custom Field" />
  <FormTooltip content={tooltipContent} />
</Box>
```

### Wrapping Custom Components

```tsx
<FieldWithTooltip content={tooltipContent}>
  <MyCustomComponent />
</FieldWithTooltip>
```

## Examples of Tooltip Content

### Sampling Parameters

**Temperature:**
- What it does: Controls randomness in token selection
- Recommended: 0.0 - 2.0 (default: 0.7)
- Effect: Higher = more creative, Lower = more focused
- When to adjust: Increase for creativity, decrease for precision

**Top P:**
- What it does: Samples from smallest set of tokens with cumulative probability > P
- Recommended: 0.1 - 1.0 (default: 0.9)
- Effect: Lower = more focused, Higher = more diverse
- When to adjust: Decrease for predictable, increase for creative

### Memory Parameters

**GPU Layers:**
- What it does: Number of model layers to offload to GPU
- Recommended: -1 or 0-n (default: -1)
- Effect: More = faster, Less = saves VRAM
- When to adjust: Decrease if OOM, increase for speed

## Troubleshooting

### Tooltip not showing

- Ensure the field name matches the key in `tooltipConfig`
- Check that `configType` is correctly passed to `getTooltipContent`
- Verify tooltip content is defined for the field

### Tooltip content cut off

- Adjust tooltip `placement` to avoid edge cases
- Reduce description length
- Adjust `maxWidth` in FormTooltip component

### Performance issues

- Increase `enterDelay` and `enterNextDelay` to reduce frequent tooltip rendering
- Consider caching tooltip content if rendering many fields

## Future Enhancements

Potential improvements:
- User preference to disable tooltips globally
- Category-based tooltips for related parameters
- Search/filter functionality in tooltips
- Multi-language support
- Link to documentation for detailed explanations
- Video tutorials or GIFs for complex parameters
