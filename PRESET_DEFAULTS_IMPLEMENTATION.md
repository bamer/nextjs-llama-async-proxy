# Llama.cpp Router Preset Defaults Implementation

## Overview

This implements the **state-of-the-art hierarchical preset system** for llama.cpp router mode with proper "\*" (wildcard) defaults support.

## Architecture

### Hierarchy (Precedence Order)

1. **`[*]` - Global Defaults** (lowest precedence)
   - Contains all default parameters for ALL models
   - Applied to every model unless overridden
   - Can be edited via UI to change global defaults

2. **`[model-name]` - Model Specific** (highest precedence)
   - Overrides global defaults for specific model
   - Only contains parameters that differ from defaults
   - Inherits all missing parameters from `[*]`

### Parameter Set

All llama.cpp router parameters supported:

```ini
[*]
; Context & Memory
ctx-size = 2048
ctx-checkpoints = 8

; GPU Offloading
n-gpu-layers = 0
split-mode = none
tensor-split =
main-gpu = 0

; Performance
threads = 0
batch = 512
ubatch = 512
threads-http = 1

; Sampling
temp = 0.7
seed = -1
samplers = penalties;dry;top_n_sigma;top_k;typ_p;top_p;min_p;xtc;temperature
mirostat = 0
mirostat-lr = 0.1
mirostat-ent = 5.0

; Speculative Decoding
draft-min = 5
draft-max = 10
draft-p-min = 0.8

; Server
cache-ram = 8192

; Router-specific
load-on-startup = false

; Advanced
mmp =
```

## Backend Changes

### New Functions

#### `getDefaultParameters()`

Returns all default parameters for llama.cpp router mode.

#### `iniSectionToModel(section, defaultsSection)`

Converts INI section to model config with inheritance:

- First applies built-in defaults
- Then merges in preset `[*]` defaults
- Finally applies model-specific overrides

#### `getPresetsDefaults(filename)`

Retrieves the `[*]` section from preset.

#### `getModelsFromPreset(filename)`

**Updated** to support inheritance from `[*]` defaults.

### New Socket.IO Events

#### `presets:get-defaults`

```javascript
// Request
{ filename: "mypreset" }

// Response
{ success: true, data: { defaults: {...} } }
```

#### `presets:update-defaults`

```javascript
// Request
{ filename: "mypreset", config: {...} }

// Response
{ success: true, data: { filename: "mypreset", defaults: {...} } }
```

## Frontend Changes

### PresetsService Updates

New methods:

- `getDefaults(filename)` - Fetch `[*]` defaults
- `updateDefaults(filename, config)` - Update `[*]` defaults

### UI Enhancements (Next Steps)

1. **Default Preset Display**
   - Show "\*" at top of preset list
   - Display all parameters with categorized layout
   - Label as "Global Defaults"

2. **Inheritance Indicators**
   - Mark which parameters are inherited vs overridden
   - Show inheritance chain: Default → Global → Model
   - Visual diff between global and model-specific

3. **Editing**
   - Allow editing global defaults in dedicated section
   - Auto-update all models without explicit overrides
   - Show impact preview

## Example Preset File

```ini
LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 4096
n-gpu-layers = 40
temp = 0.7
threads = 8
batch = 512

[llama-2-70b]
model = /models/llama-2-70b-q4_k_m.gguf
n-gpu-layers = 80
ctx-size = 8192

[llama-2-13b]
model = /models/llama-2-13b-q4_k_m.gguf
n-gpu-layers = 40
load-on-startup = true

[mistral-7b]
model = /models/mistral-7b-q5_k_m.gguf
temp = 0.3
```

### Effective Configuration (After Inheritance)

| Parameter       | llama-2-70b | llama-2-13b | mistral-7b |
| --------------- | ----------- | ----------- | ---------- |
| ctx-size        | 8192\*      | 4096        | 4096       |
| n-gpu-layers    | 80\*        | 40          | 40         |
| temp            | 0.7         | 0.7         | 0.3\*      |
| threads         | 8           | 8           | 8          |
| batch           | 512         | 512         | 512        |
| load-on-startup | false       | true\*      | false      |

\*Overridden values

## Benefits

✅ **DRY Principle** - No duplication of default parameters  
✅ **Easy Global Changes** - Update `[*]` to affect all models  
✅ **Clear Overrides** - See exactly what's different per model  
✅ **Proper Inheritance** - Models inherit from global defaults  
✅ **State-of-Art Design** - Matches industry standards (Kubernetes, Terraform, etc.)  
✅ **Llama.cpp Native** - Uses proper `.ini` format recognized by router mode

## Testing

The implementation should be tested with:

1. Create preset with `[*]` section
2. Add models without all parameters (they inherit from `[*]`)
3. Verify `getModelsFromPreset()` merges correctly
4. Update `[*]` defaults and verify all models updated
5. Export INI and verify format is correct

## Files Modified

- `/server/handlers/presets.js` - Backend logic and handlers
- `/public/js/services/presets.js` - Frontend service methods
- `/public/js/pages/presets.js` - Will need UI updates (next phase)
