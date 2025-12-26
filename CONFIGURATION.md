# Llama Server Proxy Configuration

This document describes all available configuration options for the Llama proxy.

## Web Interface Configuration

Access `/settings` in the application to configure the proxy through a graphical interface.

## API Configuration

### Endpoint: `GET /api/config`
Retrieves the current complete configuration.

### Endpoint: `POST /api/config`
Updates the configuration.

```json
{
  "llama_server": {
    "host": "localhost",
    "port": 8080,
    "timeout": 30000
  },
  "llama_config": {
    // All options below
  },
  "model_paths": {
    "modelsDir": "./models",
    "defaultModel": ""
  },
  "reset": false // true to reset all config
}
```

## Llama-Server Configuration Options

### Server Options
- `port` (number, default: 8080): Server port
- `host` (string, default: "127.0.0.1"): Listening address
- `timeout` (number, default: 30000): Request timeout in ms

### Model Options
- `model` (string): Path to model file (.gguf)

### Context and Memory Options
- `context_size` | `n_ctx` (number, default: 2048): Context size
- `n_batch` (number, default: 512): Batch size for prompt processing
- `n_ubatch` (number, default: 512): Unified batch size

### GPU Options
- `n_gpu_layers` (number, default: 0): Number of layers to offload to GPU
- `main_gpu` (number, default: 0): Main GPU index
- `tensor_split` (string): Tensor split across GPUs (comma-separated)
- `n_gqa` (number, default: 0): Group Query Attention factor

### CPU Options
- `n_threads` (number, default: -1): Number of threads (-1 = auto)
- `n_threads_batch` (number, default: -1): Batch processing threads

### Sampling Options
- `temperature` (number, 0-2, default: 0.7): Sampling temperature
- `top_k` (number, min: 1, default: 40): Top-K sampling
- `top_p` (number, 0-1, default: 0.9): Top-P sampling
- `min_p` (number, 0-1, default: 0.0): Minimum probability
- `xtc_probability` (number, 0-1, default: 0.0): XTC probability
- `xtc_threshold` (number, 0-1, default: 0.1): XTC threshold
- `typical_p` (number, 0-1, default: 1.0): Typical sampling
- `repeat_last_n` (number, min: 0, default: 64): Repeat penalty window
- `repeat_penalty` (number, min: 0, default: 1.0): Repeat penalty
- `presence_penalty` (number, -2-2, default: 0.0): Presence penalty
- `frequency_penalty` (number, -2-2, default: 0.0): Frequency penalty
- `dry_multiplier` (number, min: 0, default: 0.0): DRY multiplier
- `dry_base` (number, min: 0, default: 1.75): DRY base
- `dry_allowed_length` (number, min: 0, default: 2): DRY allowed length
- `dry_penalty_last_n` (number, min: 0, default: 20): DRY window
- `dry_sequence_breaker` (string): DRY sequence breaker (JSON array)

### Generation Options
- `max_tokens` (number, min: 1, default: 100): Maximum number of tokens
- `max_seq_len` (number, min: 0, default: 0): Maximum sequence length
- `seed` (number, default: -1): Random seed (-1 = random)

### Model Loading Options
- `embedding` (boolean, default: false): Embedding mode
- `memory_f16` (boolean, default: false): Use F16
- `memory_f32` (boolean, default: false): Use F32
- `memory_auto` (boolean, default: true): Auto memory type selection
- `vocab_only` (boolean, default: false): Load vocabulary only

### RoPE Options
- `rope_freq_base` (number, default: 0.0): RoPE frequency base
- `rope_freq_scale` (number, default: 0.0): RoPE frequency scale

### YaRN Options
- `yarn_ext_factor` (number, default: 0.0): YaRN extension factor
- `yarn_attn_factor` (number, default: 0.0): YaRN attention factor
- `yarn_beta_fast` (number, default: 0.0): YaRN beta fast
- `yarn_beta_slow` (number, default: 0.0): YaRN beta slow

### Server Options
- `api_keys` (string): API keys (comma-separated)
- `ssl_cert_file` (string): SSL certificate file
- `ssl_key_file` (string): SSL key file
- `cors_allow_origins` (string): Allowed CORS origins
- `system_prompt` (string): System prompt
- `chat_template` (string): Chat template

### Logging Options
- `log_format` (string, "text"|"json", default: "text"): Log format
- `log_level` (string, "debug"|"info"|"warn"|"error", default: "info"): Log level
- `log_colors` (boolean, default: true): Colors in logs
- `log_verbose` (boolean, default: false): Verbose logging

### Other Options
- `cache_reuse` (number, default: 0): Cache reuse level
- `cache_type_k` (string, "f16"|"f32"|"q8_0"|"q4_0", default: "f16"): Cache type for K
- `cache_type_v` (string, "f16"|"f32"|"q8_0"|"q4_0", default: "f16"): Cache type for V
- `ml_lock` (boolean, default: false): Lock memory
- `no_kv_offload` (boolean, default: false): Disable KV offload

## Environment Variables Configuration

Environment variables are loaded at startup and can be overridden by runtime configuration.

```bash
# Server
LLAMA_SERVER_PORT=8134
LLAMA_SERVER_HOST=localhost
LLAMA_SERVER_TIMEOUT=30000

# Models
LLAMA_MODELS_DIR=./models
LLAMA_DEFAULT_MODEL=

# Common options
LLAMA_CONTEXT_SIZE=4096
LLAMA_GPU_LAYERS=35
LLAMA_THREADS=-1
LLAMA_TEMPERATURE=0.7
LLAMA_TOP_P=0.9
LLAMA_MAX_TOKENS=200
```

## Usage Examples

### Basic Configuration
```json
{
  "llama_server": {
    "host": "localhost",
    "port": 8080
  },
  "llama_config": {
    "n_ctx": 4096,
    "n_gpu_layers": 35,
    "temperature": 0.7
  },
  "model_paths": {
    "modelsDir": "/home/user/models"
  }
}
```

### Advanced GPU Configuration
```json
{
  "llama_config": {
    "n_ctx": 8192,
    "n_batch": 1024,
    "n_gpu_layers": 40,
    "main_gpu": 0,
    "tensor_split": "7,7,7,7",
    "n_gqa": 1,
    "cache_type_k": "q8_0",
    "cache_type_v": "q8_0",
    "temperature": 0.8,
    "top_p": 0.9,
    "repeat_penalty": 1.1,
    "presence_penalty": 0.1
  }
}
```

### Chat Configuration
```json
{
  "llama_config": {
    "chat_template": "llama2",
    "system_prompt": "You are a helpful AI assistant.",
    "temperature": 0.7,
    "max_tokens": 512,
    "repeat_penalty": 1.1,
    "presence_penalty": 0.1,
    "frequency_penalty": 0.1
  }
}
```