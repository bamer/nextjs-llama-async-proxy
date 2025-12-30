# Model Configuration Workflow - Quick Reference

## Overview

You can now **configure a model before loading it** using the new configuration dialog. This allows you to customize all parameters (sampling, memory, GPU, advanced, LoRA, multimodal) before starting a model.

---

## Workflow

### 1. View Models
Navigate to the **Models** page (`/models`) to see all available models.

### 2. Configure Model
Each model card has **6 configuration buttons**:
- **Sampling** - Temperature, top_p, top_k, repeat_penalty, mirostat, seed
- **Memory** - Context size, batch size, cache RAM, F16, lock
- **GPU** - GPU layers, tensor split, device, MMLock
- **Advanced** - RoPE, YaRN, threads, pooling, reasoning format
- **LoRA** - Adapter path, base model, scale, control vectors
- **Multimodal** - MMProj, image data, CLIP vision cache

### 3. Edit Configuration
1. **Click** any configuration button (e.g., "Sampling")
2. **Dialog opens** showing current values for that configuration type
3. **Edit** parameters using:
   - **Sliders** for numeric values (temperature, top_p, etc.)
   - **Text inputs** for numbers and file paths
   - **Switches** for boolean options (cache, lock, F16, etc.)
   - **Select dropdowns** for enum values (Mirostat mode, pooling type)
4. **Hover** over parameter labels to see tooltips with descriptions

### 4. Save Configuration
1. **Click** "Save Configuration" button
2. **WebSocket sends** `save_config` message to backend
3. **Backend saves** configuration to database
4. **Dialog closes** and button shows checkmark ✓

### 5. Start Model
1. **Click** "Start" button on model card
2. **Model loads** with your saved configuration
3. **Model status** updates to "running"

---

## Configuration Types

### Sampling Configuration
Controls text generation behavior:

| Parameter | Range | Default | Description |
|-----------|--------|----------|-------------|
| Temperature | 0.0 - 2.0 | 0.7 | Controls randomness (higher = more random) |
| Top P | 0.0 - 1.0 | 0.9 | Cumulative probability threshold |
| Top K | 1 - 200 | 40 | Top K tokens to consider |
| Min P | 0.0 - 1.0 | 0.05 | Minimum probability threshold |
| Typical P | 0.0 - 1.0 | 1.0 | Typical probability threshold |
| Repeat Penalty | 0.0 - 2.0 | 1.1 | Penalize repeated tokens |
| Repeat Last N | 0 - 2048 | 64 | Last N tokens to check for repetition |
| Frequency Penalty | 0.0 - 2.0 | 0.0 | Penalize frequent tokens |
| Presence Penalty | 0.0 - 2.0 | 0.0 | Penalize new tokens |
| Mirostat Mode | 0/1/2 | 0 | 0=disabled, 1=Mirostat, 2=Mirostat 2.0 |
| Mirostat Tau | 0.0 - 10.0 | 5.0 | Mirostat target entropy |
| Mirostat Eta | 0.0 - 1.0 | 0.1 | Mirostat learning rate |
| Seed | -1 - 2^31-1 | -1 | Random seed (-1 = random) |

**Best Practices:**
- **Creative writing**: Increase temperature (0.8-1.2)
- **Factual responses**: Lower temperature (0.2-0.5)
- **Code generation**: Very low temperature (0.1-0.3), high top_k
- **Conversational**: Temperature 0.7, top_p 0.9

### Memory Configuration
Controls memory allocation and caching:

| Parameter | Range | Default | Description |
|-----------|--------|----------|-------------|
| Context Size | 512 - 32768 | 2048 | Max context window size (tokens) |
| Batch Size | 1 - 512 | 512 | Batch size for processing |
| Cache RAM | 0 - 128GB | 0 | Memory cache (0 = unlimited) |
| Cache Type K | enum | f16 | KV cache type for K |
| Cache Type V | enum | f16 | KV cache type for V |
| Memory F16 | true/false | true | Use float16 for memory |
| Memory Lock | true/false | false | Lock memory in RAM |

**Best Practices:**
- **Long conversations**: Increase context size (4096-8192)
- **Limited RAM**: Set cache RAM limit (e.g., 8GB)
- **Maximum performance**: Enable memory lock (requires sufficient RAM)

### GPU Configuration
Controls GPU usage and acceleration:

| Parameter | Range | Default | Description |
|-----------|--------|----------|-------------|
| Device | CPU/CUDA/Metal | CUDA | Compute device |
| GPU Layers | -1 - 100 | -1 | -1 = all layers, 0 = CPU only |
| N GPU | 1 - 8 | 1 | Number of GPUs to use |
| Tensor Split | comma-separated | - | Split tensors across GPUs (e.g., 10,10) |
| Main GPU | 0 - 7 | 0 | Primary GPU for ops |
| MMlock | true/false | false | Lock model in GPU memory |

**Best Practices:**
- **Single GPU**: GPU Layers = -1 (all layers)
- **Multi-GPU**: Set N GPU and tensor split
- **CPU inference**: GPU Layers = 0, Device = CPU
- **Hybrid**: GPU Layers = 30 (partial offload)

### Advanced Configuration
Advanced model settings:

| Parameter | Range | Default | Description |
|-----------|--------|----------|-------------|
| Num Ctx | 512 - 32768 | 512 | Context size (same as memory config) |
| Num Batch | 1 - 512 | 512 | Batch size |
| RoPE Frequency | 10000 - 1000000 | 10000 | RoPE base frequency |
| RoPE Scale | 0.1 - 10.0 | 1.0 | RoPE scaling factor |
| YaRN Ext Factor | - | - | YaRN extrapolation factor |
| YaRN Orig Ctx | - | - | YaRN original context |
| Threads | 1 - 32 | 4 | Number of CPU threads |
| Pooling Type | enum | - | Attention pooling |
| Reasoning Format | enum | - | Reasoning output format |
| Predict Tokens | -1 - 100 | -1 | Tokens to predict (-1 = infinite) |

### LoRA Configuration
Low-Rank Adaptation adapters:

| Parameter | Type | Default | Description |
|-----------|--------|----------|-------------|
| LoRA Adapter | path | - | Path to LoRA adapter file |
| LoRA Base | path | - | Path to base model |
| LoRA Scale | 0.0 - 1.0 | 1.0 | LoRA scaling factor |
| Control Vectors | paths | - | Paths to control vectors |

**Best Practices:**
- **Multiple adapters**: Comma-separated paths for LoRA Adapter
- **Blending**: Set LoRA Scale between 0.5-0.8 for balanced results
- **Controlled generation**: Use control vectors for style guidance

### Multimodal Configuration
Vision/multimodal model settings:

| Parameter | Type | Default | Description |
|-----------|--------|----------|-------------|
| MMProj | path | - | Path to multimodal projector |
| MMProj URL | URL | - | URL to download MMProj |
| Image Data | - | - | Input image data |
| CLIP Vision Cache | true/false | false | Cache CLIP vision features |
| Image Min Tokens | 0 - 100 | 0 | Minimum tokens for image |

---

## Example Configuration Scenarios

### Scenario 1: Creative Writing Assistant
```
Sampling:
  - Temperature: 0.9 (high creativity)
  - Top P: 0.95
  - Repeat Penalty: 1.0 (allow some repetition)
  - Seed: -1 (random)

Memory:
  - Context Size: 4096 (longer conversations)

GPU:
  - GPU Layers: -1 (full acceleration)
```

### Scenario 2: Code Generation Assistant
```
Sampling:
  - Temperature: 0.2 (deterministic)
  - Top K: 40
  - Repeat Penalty: 1.3 (avoid repeated code)

Memory:
  - Context Size: 8192 (large codebases)

GPU:
  - GPU Layers: 50 (partial offload for memory)
```

### Scenario 3: Low-Resource System (CPU Only)
```
GPU:
  - Device: CPU
  - GPU Layers: 0

Memory:
  - Cache RAM: 4GB (limit memory usage)
  - Memory Lock: false

Advanced:
  - Threads: 2 (use fewer CPU threads)
```

---

## UI Features

### Visual Indicators
- **Checkmark (✓)**: Configuration saved and loaded
- **Spinner**: Loading configuration from database
- **Grayed button**: Configuration not yet loaded

### Dialog Features
- **Auto-save**: Save button enabled only when changes made
- **Tooltips**: Hover over parameter labels for descriptions
- **Responsive**: Adapts to screen size
- **Dark/Light Mode**: Follows theme setting
- **Keyboard**: Tab to navigate, Escape to close

### Change Tracking
The dialog automatically detects changes:
- **Save Button**: Disabled when no changes
- **Enabled**: Only when user modifies at least one field
- **Cancel**: Discards unsaved changes

---

## Technical Details

### WebSocket Messages
- **Load Config**: `load_config { id, type }`
- **Save Config**: `save_config { id, type, config }`
- **Config Loaded**: `config_loaded { success, data: { id, type, config } }`
- **Config Saved**: `config_saved { success, data: { id, type, config } }`

### Database Persistence
- All configurations saved to normalized database tables
- Config types: `model_sampling_config`, `model_memory_config`, etc.
- Linked to models via foreign key (`model_id`)
- Cascade delete on model deletion

### Type Safety
- Full TypeScript typing for all parameters
- Proper validation on inputs
- Default values from database schema
- MUI v8 patterns (using `size` prop)

---

## Troubleshooting

### Configuration Not Loading
- **Check WebSocket connection**: Ensure connected to backend
- **Verify model ID**: Model must exist in database
- **Check backend logs**: Look for errors in config loading

### Changes Not Saving
- **Ensure Save clicked**: Must click "Save Configuration" button
- **Check WebSocket**: Backend must receive `save_config` message
- **Verify database**: Check for write errors in logs

### Model Not Using Config
- **Start model after saving**: Config must be saved before starting
- **Check config loaded**: Button should show checkmark ✓
- **Verify backend**: Backend must load config when starting model

---

## Summary

You can now:
1. ✅ **Configure** any model type (sampling, memory, GPU, advanced, LoRA, multimodal)
2. ✅ **Edit** 101+ parameters across 6 configuration types
3. ✅ **Save** configurations to database
4. ✅ **Start** models with your custom settings
5. ✅ **View** tooltips and descriptions for all parameters
6. ✅ **Track** changes before saving

The configuration dialog provides a user-friendly interface for fine-tuning model behavior before loading!
