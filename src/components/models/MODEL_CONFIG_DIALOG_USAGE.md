# ModelConfigDialog Usage Guide

## Overview

The `ModelConfigDialog` component allows users to view and edit model configuration parameters before loading a model. It supports 6 different configuration types: Sampling, Memory, GPU, Advanced, LoRA, and Multimodal.

## Component Location

`src/components/models/ModelConfigDialog.tsx`

## Basic Usage

```typescript
"use client";

import { useState } from "react";
import { ModelConfigDialog } from "@/components/models/ModelConfigDialog";
import { Button } from "@mui/material";

export function ModelCard({ model }: { model: any }) {
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    type: "sampling" | "memory" | "gpu" | "advanced" | "lora" | "multimodal";
    config?: any;
  }>({
    open: false,
    type: "sampling",
  });

  // Open configuration dialog for specific type
  const handleConfigure = (configType: any) => {
    setConfigDialog({
      open: true,
      type: configType,
      config: model.configurations?.[configType] || undefined,
    });
  };

  // Handle saving configuration
  const handleSaveConfig = async (savedConfig: any) => {
    try {
      // Save to database via API
      const response = await fetch(`/api/database/models/${model.id}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: configDialog.type,
          config: savedConfig,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      // Update local state or refetch models
      console.log("Configuration saved:", savedConfig);
    } catch (error) {
      console.error("Error saving configuration:", error);
      // Show error message to user
    }
  };

  return (
    <div>
      {/* Configure buttons for each type */}
      <Button onClick={() => handleConfigure("sampling")}>
        Configure Sampling
      </Button>
      <Button onClick={() => handleConfigure("memory")}>
        Configure Memory
      </Button>
      <Button onClick={() => handleConfigure("gpu")}>
        Configure GPU
      </Button>
      <Button onClick={() => handleConfigure("advanced")}>
        Configure Advanced
      </Button>
      <Button onClick={() => handleConfigure("lora")}>
        Configure LoRA
      </Button>
      <Button onClick={() => handleConfigure("multimodal")}>
        Configure Multimodal
      </Button>

      {/* Configuration Dialog */}
      <ModelConfigDialog
        open={configDialog.open}
        modelId={model.id}
        configType={configDialog.type}
        config={configDialog.config}
        onClose={() => setConfigDialog({ ...configDialog, open: false })}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
```

## Integration with Existing Models Page

### Step 1: Import the component

```typescript
import { ModelConfigDialog } from "@/components/models/ModelConfigDialog";
```

### Step 2: Add state for dialog

```typescript
const [configDialog, setConfigDialog] = useState<{
  open: boolean;
  modelId: number;
  type: "sampling" | "memory" | "gpu" | "advanced" | "lora" | "multimodal";
  config?: any;
}>({
  open: false,
  modelId: 0,
  type: "sampling",
});
```

### Step 3: Create handler functions

```typescript
const handleOpenConfig = (modelId: number, configType: string, config?: any) => {
  setConfigDialog({
    open: true,
    modelId,
    type: configType as any,
    config,
  });
};

const handleCloseConfig = () => {
  setConfigDialog((prev) => ({ ...prev, open: false }));
};

const handleSaveConfig = async (config: any) => {
  try {
    const response = await fetch(`/api/database/models/${configDialog.modelId}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: configDialog.type,
        config,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save configuration");
    }

    // Refetch models to show updated configuration
    await refetch();
    handleCloseConfig();
  } catch (error) {
    console.error("Error saving configuration:", error);
    // Show error toast
  }
};
```

### Step 4: Update configure buttons

Replace existing configure buttons to open the dialog:

```typescript
// Before (just clicking button):
<Button onClick={() => handleConfigAction(model.id, "sampling")}>
  Sampling Config
</Button>

// After (open configuration dialog):
<Button onClick={() => handleOpenConfig(model.id, "sampling", model.configurations?.sampling)}>
  Sampling Config
</Button>
```

### Step 5: Add the dialog to the component

```typescript
return (
  <div>
    {/* Your existing models grid/cards */}

    {/* Configuration Dialog */}
    <ModelConfigDialog
      open={configDialog.open}
      modelId={configDialog.modelId}
      configType={configDialog.type}
      config={configDialog.config}
      onClose={handleCloseConfig}
      onSave={handleSaveConfig}
    />
  </div>
);
```

## Configuration Types

### Sampling Configuration
Controls text generation parameters:
- Temperature (0-2): Randomness in output
- Top P (0-1): Nucleus sampling
- Top K: Limit to K most probable tokens
- Min P: Minimum probability threshold
- Typical P: Locally typical sampling
- Repeat Penalty (0-2): Reduce repetition
- Repeat Last N: Tokens considered for repeat penalty
- Frequency/Penalty Penalty: Penalize frequent tokens
- Mirostat: Advanced sampling algorithm
- Seed: Random seed (-1 for random)

### Memory Configuration
Controls memory and context:
- Context Size: Token context window
- Batch Size: Processing batch size
- Cache RAM (MB): Memory limit (0 = unlimited)
- Memory F16: Use 16-bit floats
- Memory Lock: Lock memory in RAM

### GPU Configuration
Controls GPU usage:
- GPU Layers: Layers to offload (-1 = all)
- Number of GPUs: GPU count
- Tensor Split: Comma-separated split values
- Main GPU: Primary GPU ID
- Lock MM Tensors: Lock multimodal tensors

### Advanced Configuration
Advanced generation parameters:
- RoPE Frequency/Scale: Position encoding
- YaRN Parameters: Context length extension
- Number of Threads: CPU thread count
- Max Predict Tokens: Output token limit

### LoRA Configuration
LoRA adapter settings:
- Adapter Path: Path to LoRA file
- Base Model: Base model for adapter
- Scale (0-1): Adapter scaling factor
- Control Vectors: Paths to vector files

### Multimodal Configuration
Multimodal model settings:
- Image Data: Input image
- Cache CLIP Vision: Cache vision model
- MMProj Path: Projection model path

## API Integration

### Save Configuration API Route

Create `/api/database/models/[id]/config/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = parseInt(params.id);
    const { type, config } = await request.json();

    // Validate input
    if (!type || !config) {
      return NextResponse.json(
        { error: "Type and config are required" },
        { status: 400 }
      );
    }

    // Update configuration in database
    await db.models.updateConfig(modelId, type, config);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
```

### Load Configuration API Route

Add to existing `/api/database/models/[id]/route.ts`:

```typescript
// GET with type query parameter to fetch specific config
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type) {
      // Return specific configuration
      const config = await db.models.getConfig(modelId, type);
      return NextResponse.json({ data: config });
    }

    // Return all configurations
    const configs = await db.models.getAllConfigs(modelId);
    return NextResponse.json({ data: configs });
  } catch (error) {
    console.error("Error fetching configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch configurations" },
      { status: 500 }
    );
  }
}
```

## Styling

The component uses Material-UI v8 with dark/light mode support. The dialog is responsive and works on mobile devices. All form fields have tooltips explaining each parameter.

## TypeScript Types

The component exports these types for use in your application:

```typescript
import type {
  SamplingConfig,
  MemoryConfig,
  GPUConfig,
  AdvancedConfig,
  LoRAConfig,
  MultimodalConfig,
  ConfigType,
  ModelConfigDialogProps,
} from "@/components/models/ModelConfigDialog";
```

## Best Practices

1. **Always pass modelId**: Even though it's not used in the dialog now, it's kept for future features
2. **Preload configs**: Pass existing configurations to avoid showing defaults when config exists
3. **Handle errors**: Show user-friendly error messages when save fails
4. **Refresh data**: Refetch models after saving to show updated configurations
5. **Loading states**: Consider adding loading indicators while saving

## Future Enhancements

- Preset configurations dropdown
- Export/import configuration files
- Configuration validation based on model requirements
- Real-time parameter preview/impact estimation
- Configuration history/undo functionality
- Sharing configurations between models
