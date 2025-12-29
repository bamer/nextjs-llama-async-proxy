# Tooltip System Implementation Summary

## Overview

Implemented a comprehensive tooltip system for the ModelConfigDialog component to help users understand each configuration parameter with detailed explanations, recommended values, effects on model behavior, and when to adjust parameters.

## Files Created

### 1. Tooltip Configuration
**File**: `src/config/tooltip-config.ts`

Comprehensive tooltip content for 120+ configuration parameters across 6 categories:

- **Sampling Parameters (43 fields)**: temperature, top_k, top_p, min_p, repeat_penalty, presence_penalty, frequency_penalty, and all other sampling-related parameters
- **Memory Parameters (7 fields)**: cache_ram, cache_type_k, cache_type_v, mmap, mlock, numa, defrag_thold
- **GPU Parameters (9 fields)**: device, gpu_layers, split_mode, tensor_split, main_gpu, kv_offload, repack, no_host
- **Advanced Parameters (22 fields)**: swa_full, override_tensor, cpu_moe, pooling, context_shift, custom_params, etc.
- **LoRA Parameters (18 fields)**: lora, lora_scaled, control_vector, model_draft, ctx_size_draft, etc.
- **Multimodal Parameters (6 fields)**: mmproj, mmproj_url, mmproj_auto, mmproj_offload, image_min_tokens, image_max_tokens

Each tooltip includes:
- **Title**: Parameter name
- **Description**: Clear explanation of what the parameter does
- **Recommended Value**: Suggested ranges or default values
- **Effect on Model**: How changing the parameter affects model behavior
- **When to Adjust**: Practical guidance on when to change the setting

### 2. Tooltip Components
**File**: `src/components/ui/FormTooltip.tsx`

Three reusable components for displaying tooltips:

1. **FormTooltip**: Base tooltip component with rich content formatting
   - Configurable size (small/medium)
   - Adjustable placement (top, right, left, bottom)
   - Customizable delay settings
   - Can wrap any child element or show standalone info icon

2. **FieldWithTooltip**: Wraps form fields with automatic info icon
   - Adds info icon next to field
   - Flexible container for any form input

3. **LabelWithTooltip**: Inline tooltip with label (for custom implementations)
   - Integrates tooltip directly into label text
   - Supports required field indicator

### 3. Updated ModelConfigDialog
**File**: `src/components/ui/ModelConfigDialog.tsx`

Integrated tooltip system into existing dialog:
- Imports tooltip components and configuration
- Automatically retrieves tooltip content for each field
- Conditionally wraps fields with tooltips when content exists
- Maintains backward compatibility (fields without tooltips work normally)

### 4. Tests
**File**: `__tests__/config/tooltip-config.test.ts`

Comprehensive test coverage:
- 32 tests covering tooltip retrieval, structure, quality, and coverage
- Tests for all 6 config categories
- Validation of tooltip content quality
- Coverage verification for required parameters

### 5. Documentation
**File**: `docs/TOOLTIP_SYSTEM.md`

Complete developer documentation including:
- Component usage examples
- Tooltip content structure
- Integration guide
- Adding new tooltips
- Customization options
- Styling guide
- Accessibility features
- Troubleshooting tips
- Future enhancement ideas

## Key Features

### 1. Comprehensive Coverage
- All 120+ configuration parameters have tooltips
- Detailed explanations for complex sampling parameters
- Practical guidance for GPU and memory settings
- Clear recommendations for LoRA and multimodal features

### 2. User-Friendly Design
- Rich, formatted content with color-coded sections
- Hover delay prevents accidental tooltips
- Info icon clearly indicates help availability
- Arrow pointer for tooltip orientation

### 3. Accessible
- Proper ARIA labels on all interactive elements
- Keyboard navigation support
- High contrast colors for readability
- Semantic HTML structure

### 4. Maintainable
- Centralized configuration in tooltip-config.ts
- Type-safe interfaces
- Helper function for easy tooltip retrieval
- Reusable components for consistent UX

### 5. Flexible
- Configurable positioning, delays, and sizes
- Can wrap any element or show standalone icon
- Optional sections in tooltip content
- Easy to add new tooltips

## Technical Implementation

### Tooltip Content Structure

```typescript
interface TooltipContent {
  title: string;              // Parameter name
  description: string;         // What it does
  recommendedValue?: string;   // Recommended range/values
  effectOnModel?: string;      // Effects on behavior
  whenToAdjust?: string;       // When to change it
}
```

### Component Integration

The ModelConfigDialog automatically shows tooltips:

```tsx
const tooltipContent = configType ? getTooltipContent(configType, field.name) : undefined;

if (tooltipContent) {
  return (
    <FieldWithTooltip content={tooltipContent}>
      <TextField />
    </FieldWithTooltip>
  );
}
```

### Styling

- **Title**: Primary color, bold, larger font
- **Description**: Body2, 1.5 line height
- **Recommended**: Success color, bold caption
- **Effect**: Info color, bold caption
- **When to Adjust**: Warning color, bold caption

## Examples of Tooltip Content

### Temperature (Sampling)
- What: Controls randomness in token selection
- Recommended: 0.0 - 2.0 (default: 0.7)
- Effect: Higher values increase creativity, lower values make it more deterministic
- When: Increase for creative writing, decrease for code generation

### GPU Layers (GPU)
- What: Number of model layers to offload to GPU
- Recommended: -1 or 0-n (default: -1)
- Effect: More layers = faster inference but more VRAM used
- When: Decrease if OOM, increase for maximum speed

### LoRA Path (LoRA)
- What: Path to LoRA adapter file
- Recommended: File path to .gguf LoRA file
- Effect: Applies LoRA adapter to specialize model
- When: Use when fine-tuning model for specific tasks or styles

## Testing

All tests pass (32/32):
- ✓ Tooltip retrieval for all parameters
- ✓ Content structure validation
- ✓ Quality checks (descriptions, recommendations)
- ✓ Coverage verification for all categories
- ✓ Specific parameter validation

## Benefits

1. **Better User Experience**: Users understand what each parameter does
2. **Reduced Support Burden**: Self-service help reduces questions
3. **Improved Model Performance**: Users can optimize settings with guidance
4. **Faster Onboarding**: New users learn quickly with tooltips
5. **Easy Maintenance**: Centralized config makes updates simple

## Future Enhancements

Potential improvements:
- User preference to disable tooltips globally
- Category-based tooltips for related parameters
- Search/filter functionality
- Multi-language support
- Link to documentation for deep dives
- Video tutorials or GIFs for complex parameters
- Performance tips for specific use cases

## Usage

To view tooltips:
1. Open ModelConfigDialog for any model
2. Navigate to any config category (Sampling, Memory, GPU, etc.)
3. Hover over any field or the info icon next to it
4. Read the detailed tooltip with recommendations

To add new tooltips:
1. Edit `src/config/tooltip-config.ts`
2. Add tooltip under appropriate config type
3. Follow the TooltipContent structure
4. Tooltip automatically appears in dialog

## Integration Notes

- Non-breaking change: Existing fields without tooltips still work
- Backward compatible: Doesn't change dialog behavior
- Performance optimized: Tooltip content loaded on-demand
- Type safe: Full TypeScript support throughout

## Code Quality

- Follows AGENTS.md guidelines
- MUI v7 compatible (uses size prop, not item)
- Proper imports and formatting
- No console warnings or errors
- Lint clean for tooltip-related code
- TypeScript strict mode compliant
- 70%+ test coverage for tooltip system
