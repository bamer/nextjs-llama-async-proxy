# Jinja Parameters Added to Presets

## Overview
Added comprehensive Jinja template and llama.cpp routing parameters to the preset system. You can now configure complete chat template settings, reasoning models, and router mode parameters.

## New Parameter Categories

### 1. **Jinja & Templating** (NEW)
Enable and configure Jinja template engine for chat completions:

- **Enable Jinja** (`jinja`)
  - Toggle Jinja template engine on/off
  - Default: `true`
  - CLI: `--jinja, --no-jinja`

- **Chat Template** (`chat-template`)
  - Select predefined template
  - Options: chatml, llama2, llama3, llama3-1, llama3-2, mistral, phi, phi3, phi4, gemma, zephyr, deepseek, qwen, openchat, neural-chat, stablelm, cohere, command
  - Overridden by template file if specified
  - CLI: `--chat-template`

- **Chat Template File** (`chat-template-file`)
  - Path to custom Jinja template file
  - Example: `/path/to/template.jinja`
  - CLI: `--chat-template-file`

- **Reasoning Format** (`reasoning-format`)
  - Control how reasoning/thinking tokens appear in output
  - Options: default (no reasoning), deepseek, none (raw)
  - CLI: `--reasoning-format`

- **Reasoning Budget** (`reasoning-budget`)
  - Maximum tokens for reasoning
  - `-1` = unlimited thinking
  - `0` = disabled
  - CLI: `--reasoning-budget`

- **Thinking Forced Open** (`thinking-forced-open`)
  - Force reasoning models to always show their thinking
  - CLI: `--thinking-forced-open`

### 2. **Context Management** (NEW)
Manage KV cache and parallel processing slots:

- **Slot Save Path** (`slot-save-path`)
  - Directory for saving/restoring prompt cache
  - CLI: `--slot-save-path`

- **Cache Type (K)** (`cache-type-k`)
  - KV cache type for K values (f16, q4, q8)
  - CLI: `--cache-type-k`

- **Cache Type (V)** (`cache-type-v`)
  - KV cache type for V values (f16, q4, q8)
  - CLI: `--cache-type-v`

- **Parallel Slots** (`slots`)
  - Number of parallel processing slots
  - Default: `1`
  - Range: 1-128
  - CLI: `-np, --parallel`

### 3. **Model Loading** (NEW)
Router mode and model management settings:

- **Models Directory** (`models-dir`)
  - Directory for auto-discovering models in router mode
  - Example: `/path/to/models`
  - CLI: `--models-dir`

- **Max Models Loaded** (`models-max`)
  - Maximum concurrent models in router mode
  - `0` = unlimited
  - Default: `4`
  - CLI: `--models-max`

- **Auto-load Models** (`models-autoload`)
  - Automatically load models on first request
  - Default: `true`
  - CLI: `--models-autoload, --no-models-autoload`

- **Model Alias** (`model-alias`)
  - Friendly name for the model
  - Example: `my-model-alias`
  - CLI: `--model-alias`

## Usage in Presets

### Example: Enable Jinja with DeepSeek Reasoning

```ini
[deepseek-model]
model = ./models/deepseek-r1-distill-llama-8b.gguf
jinja = true
chat-template = deepseek
reasoning-format = deepseek
reasoning-budget = -1
n-gpu-layers = 33
```

### Example: Router Mode Configuration

```ini
[*]
models-dir = ./models
models-max = 4
models-autoload = true
threads-http = 4

[model-group-1]
model-alias = fast-model
n-gpu-layers = 20
```

### Example: Custom Jinja Template

```ini
[custom-template-model]
model = ./models/my-model.gguf
jinja = true
chat-template-file = ./templates/my-template.jinja
cache-type-k = q4
cache-type-v = q4
```

## How to Use

1. Open **Settings → Presets**
2. Create or edit a preset
3. Expand the new **Jinja & Templating**, **Context Management**, or **Model Loading** sections
4. Add parameters as needed
5. Save the preset
6. Launch the model with the preset

## CLI Equivalents

These parameters map directly to llama.cpp command-line arguments:

```bash
# Enable Jinja with DeepSeek
llama-server \
  --jinja \
  --chat-template deepseek \
  --reasoning-format deepseek \
  --reasoning-budget -1 \
  -m ./models/model.gguf

# Router mode
llama-server \
  --models-dir ./models \
  --models-max 4 \
  --models-autoload \
  --threads-http 4

# Custom template
llama-server \
  --jinja \
  --chat-template-file ./templates/template.jinja \
  -m ./models/model.gguf
```

## Notes

- **Jinja must be enabled** to use custom chat templates
- **Template file overrides** the predefined template selection
- **Reasoning format** only works with models trained for reasoning (DeepSeek, GPT-OSS, etc.)
- **Router mode** allows serving multiple models from one server
- **Cache quantization** (q4/q8) reduces memory usage but may affect quality

## Related Files Modified

- `public/js/components/presets/parameters.js` - Added new parameter categories and definitions

## Testing

To test the new parameters:

1. Create a preset with Jinja parameters
2. Export the preset (it should include the new fields in the INI file)
3. Launch a model with the preset
4. Check server logs for `--jinja`, `--chat-template`, `--reasoning-format` flags

All parameters are properly validated and integrated with the existing preset system.
