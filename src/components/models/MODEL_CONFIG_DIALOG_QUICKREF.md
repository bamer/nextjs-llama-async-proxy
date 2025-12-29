# ModelConfigDialog Component - Quick Reference

## What Was Created

### Main Component
**File:** `src/components/models/ModelConfigDialog.tsx`

A comprehensive configuration dialog component that allows users to view and edit model parameters for 6 different configuration types.

### Configuration Types Supported

1. **Sampling Config** - Text generation parameters (temperature, top_p, top_k, repeat_penalty, mirostat, etc.)
2. **Memory Config** - Memory and context settings (context size, batch size, cache RAM, etc.)
3. **GPU Config** - GPU layer offloading and tensor management
4. **Advanced Config** - Advanced generation parameters (RoPE, YaRN, threads, etc.)
5. **LoRA Config** - LoRA adapter configuration
6. **Multimodal Config** - Multimodal model settings (vision, MMProj, etc.)

## Component Features

### UI Features
- ✅ Material-UI v7 Dialog with responsive design
- ✅ Sliders for numeric parameters with appropriate ranges
- ✅ Text inputs for numbers and file paths
- ✅ Switches for boolean options
- ✅ Select dropdowns for enum values
- ✅ Tooltips explaining each parameter
- ✅ Dark/light mode support
- ✅ Grid layout for organized parameter grouping

### Technical Features
- ✅ Full TypeScript support with proper interfaces
- ✅ Form validation (numeric ranges, required fields)
- ✅ Default values from database schema
- ✅ State management for local changes
- ✅ Save/Cancel workflow
- ✅ Proper MUI v7 patterns (no `item` prop, use `size` prop)

## Props Interface

```typescript
interface ModelConfigDialogProps {
  open: boolean;           // Dialog open state
  modelId: number;         // Model ID (for future use)
  configType: ConfigType;  // Configuration type
  config?: any;            // Current configuration values
  onClose: () => void;     // Close handler
  onSave: (config: any) => void;  // Save handler
}

type ConfigType =
  | "sampling"
  | "memory"
  | "gpu"
  | "advanced"
  | "lora"
  | "multimodal";
```

## Quick Integration

```typescript
import { ModelConfigDialog } from "@/components/models/ModelConfigDialog";

// In your component:
<ModelConfigDialog
  open={dialogOpen}
  modelId={model.id}
  configType="sampling"
  config={model.configurations?.sampling}
  onClose={() => setDialogOpen(false)}
  onSave={handleSaveConfig}
/>
```

## Parameter Coverage

### Sampling Config (13 parameters)
- temperature, top_p, top_k, min_p, typical_p
- repeat_penalty, repeat_last_n
- frequency_penalty, presence_penalty
- mirostat, mirostat_tau, mirostat_eta
- seed

### Memory Config (5 parameters)
- num_ctx, num_batch, cache_ram
- memory_f16, memory_lock

### GPU Config (5 parameters)
- n_gpu_layers, n_gpu
- tensor_split, main_gpu, mm_lock

### Advanced Config (8 parameters)
- rope_frequency, rope_scale
- yarn_ext_factor, yarn_orig_ctx, yarn_attn_factor
- yarn_beta_fast, yarn_beta_slow
- num_thread, num_predict

### LoRA Config (4 parameters)
- lora_adapter, lora_base, lora_scale, control_vectors

### Multimodal Config (3 parameters)
- image_data, clip_vision_cache, mmproj

**Total: 38 configurable parameters across 6 configuration types**

## Usage Documentation

Complete integration guide available at:
`src/components/models/MODEL_CONFIG_DIALOG_USAGE.md`

## Files Created

1. `src/components/models/ModelConfigDialog.tsx` - Main component (876 lines)
2. `src/components/models/MODEL_CONFIG_DIALOG_USAGE.md` - Integration guide

## Next Steps

To integrate this dialog into the models page:

1. Import the component
2. Add dialog state to your page component
3. Create handler functions for opening/closing/saving
4. Update configure buttons to open the dialog
5. Add API routes for saving/loading configurations
6. Test the dialog with real model data

## Testing Recommendations

- ✅ Test opening dialog for each config type
- ✅ Test editing parameters and saving
- ✅ Test validation (negative numbers, out of range)
- ✅ Test with existing configurations
- ✅ Test with new configurations (defaults)
- ✅ Test dark/light mode
- ✅ Test responsive layout on mobile
- ✅ Test API save/load functionality
