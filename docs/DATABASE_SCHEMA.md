# Database Schema - Llama Dashboard

## Overview

This database stores **metrics history** (last 10 minutes) and **all model configurations** with complete llama-server parameters.

## Installation

```bash
pnpm add -D better-sqlite3 @types/better-sqlite3
```

## Database Location

```
./data/llama-dashboard.db
```

## Schema

### 1. `metrics_history` Table

Stores the last 10 minutes of all chart metrics for restoration on refresh/relaunch.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment primary key |
| `timestamp` | INTEGER | Unix timestamp in milliseconds |
| `cpu_usage` | REAL | CPU usage percentage (0-100) |
| `memory_usage` | REAL | Memory usage percentage (0-100) |
| `disk_usage` | REAL | Disk usage percentage (0-100) |
| `gpu_usage` | REAL | GPU usage percentage (0-100) |
| `gpu_temperature` | REAL | GPU temperature in °C |
| `gpu_memory_used` | REAL | GPU memory used in MB |
| `gpu_memory_total` | REAL | GPU memory total in MB |
| `gpu_power_usage` | REAL | GPU power usage in watts |
| `active_models` | INTEGER | Number of active models |
| `uptime` | INTEGER | Server uptime in seconds |
| `requests_per_minute` | REAL | Requests per minute |
| `created_at` | INTEGER | Unix timestamp when record was created |

**Indexes:**
- `idx_metrics_timestamp` - On `timestamp` for fast time-based queries
- `idx_metrics_created_at` - On `created_at` for cleanup

**Retention:**
- Automatic cleanup of records older than 10 minutes on every insert
- Keeps database size minimal

---

### 2. `models` Table

Stores ALL models and their COMPLETE llama-server customization parameters.

| Column | Type | Description |
|--------|------|-------------|
| **Identity** | | |
| `id` | INTEGER (PK) | Auto-increment primary key |
| `name` | TEXT | Model name (NOT NULL) |
| `type` | TEXT | Model type (llama, gpt, etc.) (NOT NULL) |
| `status` | TEXT | 'running', 'stopped', 'loading', 'error' (NOT NULL) |
| `created_at` | INTEGER | Unix timestamp when model was added |
| `updated_at` | INTEGER | Unix timestamp when model was last modified |
| **Model Path & Loading** | | |
| `model_path` | TEXT | Path to model file |
| `model_url` | TEXT | Model download URL |
| `docker_repo` | TEXT | Docker Hub repository (<repo>/<model>[:quant]) |
| `hf_repo` | TEXT | Hugging Face repository (<user>/<model>[:quant]) |
| `hf_repo_draft` | TEXT | Hugging Face draft model repository |
| `hf_file` | TEXT | Hugging Face model file |
| `hf_file_v` | TEXT | Hugging Face vocoder model file |
| `hf_token` | TEXT | Hugging Face access token |
| **Context & Processing** | | |
| `ctx_size` | INTEGER | Context window size (default: 0 = from model) |
| `predict` | INTEGER | Number of tokens to predict (default: -1 = infinity) |
| `batch_size` | INTEGER | Logical maximum batch size (default: 2048) |
| `ubatch_size` | INTEGER | Physical maximum batch size (default: 512) |
| `n_parallel` | INTEGER | Number of server slots (default: -1 = auto) |
| `cont_batching` | INTEGER | Continuous batching (0=disabled, 1=enabled) |
| **Threading** | | |
| `threads` | INTEGER | CPU threads for generation (default: -1 = auto) |
| `threads_batch` | INTEGER | Threads for batch processing |
| `cpu_mask` | TEXT | CPU affinity mask (hex string) |
| `cpu_range` | TEXT | CPU range for affinity (e.g., "0-7") |
| `cpu_strict` | INTEGER | Strict CPU placement (0 or 1) |
| `cpu_mask_batch` | TEXT | CPU affinity mask for batch (hex string) |
| `cpu_range_batch` | TEXT | CPU range for batch |
| `cpu_strict_batch` | INTEGER | Strict CPU placement for batch (0 or 1) |
| `priority` | INTEGER | Process priority (-1=low, 0=normal, 1=medium, 2=high, 3=realtime) |
| `priority_batch` | INTEGER | Priority for batch |
| **Memory & Performance** | | |
| `cache_ram` | INTEGER | Max cache size in MiB (default: -1 = no limit) |
| `cache_type_k` | TEXT | KV cache type for K (f32, f16, bf16, q8_0, etc.) |
| `cache_type_v` | TEXT | KV cache type for V (f32, f16, bf16, q8_0, etc.) |
| `mmap` | INTEGER | Memory-map model (0=disabled, 1=enabled) |
| `mlock` | INTEGER | Keep model in RAM (0=disabled, 1=enabled) |
| `numa` | TEXT | NUMA optimization (distribute, isolate, numactl) |
| `defrag_thold` | INTEGER | KV cache defrag threshold (DEPRECATED) |
| **GPU Offloading** | | |
| `device` | TEXT | Device list for offloading (e.g., "0,1") |
| `list_devices` | INTEGER | Print available devices (0 or 1) |
| `gpu_layers` | INTEGER | Max layers in VRAM (-1=auto, 'all', or number) |
| `split_mode` | TEXT | Split mode (none, layer, row) |
| `tensor_split` | TEXT | Fraction per GPU (e.g., "3,1") |
| `main_gpu` | INTEGER | Main GPU index |
| `kv_offload` | INTEGER | KV cache offloading (0=disabled, 1=enabled) |
| `repack` | INTEGER | Enable weight repacking (0=disabled, 1=enabled) |
| `no_host` | INTEGER | Bypass host buffer (0=disabled, 1=enabled) |
| **Advanced Memory** | | |
| `swa_full` | INTEGER | Full-size SWA cache (0=disabled, 1=enabled) |
| `override_tensor` | TEXT | Override tensor buffer type |
| `cpu_moe` | INTEGER | Keep all MoE weights in CPU (0 or 1) |
| `n_cpu_moe` | INTEGER | Keep MoE weights of first N layers in CPU |
| `kv_unified` | INTEGER | Unified KV buffer (0=disabled, 1=enabled) |
| **Sampling Parameters** | | |
| `temperature` | REAL | Sampling temperature (default: 0.8) |
| `top_k` | INTEGER | Top-k sampling (default: 40, 0=disabled) |
| `top_p` | REAL | Top-p sampling (default: 0.9, 1.0=disabled) |
| `min_p` | REAL | Min-p sampling (default: 0.1, 0.0=disabled) |
| `top_nsigma` | REAL | Top-n sigma (default: -1.0, -1.0=disabled) |
| `xtc_probability` | REAL | XTC probability (default: 0.0, 0.0=disabled) |
| `xtc_threshold` | REAL | XTC threshold (default: 0.1, 1.0=disabled) |
| `typical` | REAL | Locally typical sampling (default: 1.0, 1.0=disabled) |
| `repeat_last_n` | INTEGER | Last n tokens for repeat penalty (default: 64) |
| `repeat_penalty` | REAL | Repeat penalty (default: 1.0, 1.0=disabled) |
| `presence_penalty` | REAL | Presence penalty (default: 0.0, 0.0=disabled) |
| `frequency_penalty` | REAL | Frequency penalty (default: 0.0, 0.0=disabled) |
| `dry_multiplier` | REAL | DRY multiplier (default: 0.0, 0.0=disabled) |
| `dry_base` | REAL | DRY base (default: 1.75) |
| `dry_allowed_length` | INTEGER | DRY allowed length (default: 2) |
| `dry_penalty_last_n` | INTEGER | DRY penalty for last n tokens (default: -1) |
| `dry_sequence_breaker` | TEXT | DRY sequence breaker (string or "none") |
| `dynatemp_range` | REAL | Dynamic temperature range (default: 0.0, 0.0=disabled) |
| `dynatemp_exp` | REAL | Dynamic temperature exponent (default: 1.0) |
| `mirostat` | INTEGER | Mirostat sampling (0=disabled, 1=enabled, 2=Mirostat2.0) |
| `mirostat_lr` | REAL | Mirostat learning rate (default: 0.1) |
| `mirostat_ent` | REAL | Mirostat target entropy (default: 5.0) |
| `samplers` | TEXT | Samplers sequence (semicolon-separated) |
| `sampler_seq` | TEXT | Simplified sampler sequence (default: edskypmxt) |
| `seed` | INTEGER | RNG seed (default: -1 = random) |
| **Grammar & Constraints** | | |
| `grammar` | TEXT | BNF grammar constraint |
| `grammar_file` | TEXT | Grammar file path |
| `json_schema` | TEXT | JSON schema constraint |
| `json_schema_file` | TEXT | JSON schema file |
| `ignore_eos` | INTEGER | Ignore end of stream token (0 or 1) |
| `escape` | BOOLEAN | Process escapes (default: true) |
| **RoPE & Attention** | | |
| `rope_scaling_type` | TEXT | RoPE scaling (none, linear, yarn) |
| `rope_scale` | REAL | RoPE context scaling factor |
| `rope_freq_base` | REAL | RoPE base frequency |
| `rope_freq_scale` | REAL | RoPE frequency scaling factor |
| `yarn_orig_ctx` | INTEGER | YaRN original context size (default: 0) |
| `yarn_ext_factor` | REAL | YaRN extrapolation mix factor (default: -1.0) |
| `yarn_attn_factor` | REAL | YaRN attention magnitude (default: -1.0) |
| `yarn_beta_slow` | REAL | YaRN high correction dim (default: -1.0) |
| `yarn_beta_fast` | REAL | YaRN low correction dim (default: -1.0) |
| `flash_attn` | TEXT | Flash attention (on, off, auto) |
| **Multi-modal** | | |
| `mmproj` | TEXT | Multimodal projector file |
| `mmproj_url` | TEXT | Multimodal projector URL |
| `mmproj_auto` | INTEGER | Auto-load multimodal projector (0 or 1) |
| `mmproj_offload` | INTEGER | GPU offload for multimodal projector (0 or 1) |
| `image_min_tokens` | INTEGER | Min tokens per image |
| `image_max_tokens` | INTEGER | Max tokens per image |
| **LoRA & Control Vectors** | | |
| `lora` | TEXT | LoRA adapter path |
| `lora_scaled` | TEXT | LoRA with scaling (FNAME:SCALE,...) |
| `control_vector` | TEXT | Control vector file |
| `control_vector_scaled` | TEXT | Control vector with scaling (FNAME:SCALE,...) |
| `control_vector_layer_range` | TEXT | Layer range for control vector |
| **Draft Model (Speculative Decoding)** | | |
| `model_draft` | TEXT | Draft model path |
| `model_url_draft` | TEXT | Draft model download URL |
| `ctx_size_draft` | INTEGER | Draft model context size |
| `threads_draft` | INTEGER | Draft model threads |
| `threads_batch_draft` | INTEGER | Draft model threads for batch |
| `draft_max` | INTEGER | Max draft tokens (default: 16) |
| `draft_min` | INTEGER | Min draft tokens (default: 0) |
| `draft_p_min` | REAL | Min draft probability (default: 0.8) |
| `cache_type_k_draft` | TEXT | KV cache type for draft model K |
| `cache_type_v_draft` | TEXT | KV cache type for draft model V |
| `cpu_moe_draft` | INTEGER | CPU MoE for draft model |
| `n_cpu_moe_draft` | INTEGER | MoE weights in CPU for first N layers (draft) |
| `n_gpu_layers_draft` | INTEGER | GPU layers for draft model |
| `device_draft` | TEXT | Device list for draft model |
| `spec_replace` | TEXT | Translate string in TARGET to DRAFT |
| **Logging** | | |
| `log_disable` | INTEGER | Disable logging (0 or 1) |
| `log_file` | TEXT | Log to file path |
| `log_colors` | TEXT | Log colors (on, off, auto) |
| `log_verbose` | INTEGER | Verbosity level (0-4, infinity) |
| `log_prefix` | INTEGER | Enable log prefix (0 or 1) |
| `log_timestamps` | INTEGER | Enable log timestamps (0 or 1) |
| `logit_bias` | TEXT | Logit bias (TOKEN_ID(+/-)BIAS,...) |
| **Server Configuration** | | |
| `host` | TEXT | Server host (default: 127.0.0.1) |
| `port` | INTEGER | Server port (default: 8080) |
| `api_prefix` | TEXT | API prefix path |
| `path` | TEXT | Static files path |
| `webui` | TEXT | WebUI config JSON |
| `webui_config_file` | TEXT | WebUI config file path |
| `no_webui` | INTEGER | Disable WebUI (0 or 1) |
| `embeddings` | INTEGER | Enable embeddings only (0 or 1) |
| `reranking` | INTEGER | Enable reranking endpoint (0 or 1) |
| `api_key` | TEXT | API key for authentication |
| `api_key_file` | TEXT | API key file path |
| `ssl_key_file` | TEXT | SSL private key file |
| `ssl_cert_file` | TEXT | SSL certificate file |
| `timeout` | INTEGER | Server timeout in seconds (default: 600) |
| `threads_http` | INTEGER | HTTP request threads |
| `cache_reuse` | INTEGER | Cache reuse chunk size |
| `metrics_enabled` | INTEGER | Enable metrics endpoint (0 or 1) |
| `props_enabled` | INTEGER | Enable props endpoint (0 or 1) |
| `slots_enabled` | INTEGER | Enable slots endpoint (0 or 1) |
| `slot_save_path` | TEXT | Save slot KV cache path |
| `media_path` | TEXT | Media files directory |
| `models_dir` | TEXT | Models directory |
| `models_preset` | TEXT | Models preset file |
| `models_max` | INTEGER | Max models to load (default: 4, 0=unlimited) |
| `models_autoload` | INTEGER | Auto-load models (0 or 1) |
| `jinja` | INTEGER | Use jinja template (0 or 1) |
| `chat_template` | TEXT | Custom jinja chat template |
| `chat_template_file` | TEXT | Custom jinja template file |
| `chat_template_kwargs` | TEXT | JSON template parser params |
| `prefill_assistant` | INTEGER | Prefill assistant response (0 or 1) |
| **Example-Specific** | | |
| `ctx_checkpoints` | INTEGER | Max context checkpoints (default: 8) |
| **Advanced** | | |
| `verbose_prompt` | INTEGER | Print verbose prompt (0 or 1) |
| `warmup` | INTEGER | Perform warmup (0 or 1) |
| `spm_infill` | INTEGER | Use Suffix/Prefix/Middle pattern (0 or 1) |
| `pooling` | TEXT | Pooling type (none, mean, cls, last, rank) |
| `context_shift` | INTEGER | Context shift (0 or 1) |
| `rpc` | TEXT | RPC servers list |
| `offline` | INTEGER | Offline mode (0 or 1) |
| `override_kv` | TEXT | Override model metadata (KEY=TYPE:VALUE,...) |
| `op_offload` | INTEGER | Offload host tensor ops (0 or 1) |
| `fit` | TEXT | Fit arguments (on, off) |
| `fit_target` | INTEGER | Fit target MiB (default: 1024) |
| `fit_ctx` | INTEGER | Fit minimum ctx size (default: 4096) |
| `check_tensors` | INTEGER | Check model tensor data (0 or 1) |
| `no_host` | INTEGER | Bypass host buffer (0 or 1) |
| `sleep_idle_seconds` | INTEGER | Sleep idle seconds (default: -1) |
| `polling` | TEXT | Polling level (0-100) |
| `polling_batch` | TEXT | Polling for batch (0 or 1) |
| `reasoning_format` | TEXT | Reasoning format (none, deepseek, deepseek-legacy, auto) |
| `reasoning_budget` | INTEGER | Reasoning budget (-1=unrestricted, 0=disabled) |
| **Custom Parameters** | | |
| `custom_params` | TEXT | Additional parameters as JSON (flexible) |

**Indexes:**
- `idx_models_name` - On `name` for fast lookups
- `idx_models_status` - On `status` for filtering
- `idx_models_type` - On `type` for filtering
- `idx_models_created` - On `created_at` for sorting

---

### 3. `metadata` Table

Stores dashboard global state and configuration.

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT (PK) | Metadata key (NOT NULL) |
| `value` | TEXT | Metadata value (NOT NULL) |
| `updated_at` | INTEGER | Unix timestamp when updated |

**Predefined Keys:**
- `db_version` - Database schema version
- `server_start_time` - Server start timestamp
- `last_metrics_save` - Last metrics save timestamp
- `theme_preference` - User theme preference
- Any custom keys for flexibility

---

## API Usage

### Initialization

```typescript
import { initDatabase, closeDatabase } from '@/lib/database';

// Initialize database (creates tables if needed)
const db = initDatabase();

// When app closes
closeDatabase();
```

### Metrics History

```typescript
import { saveMetrics, getMetricsHistory } from '@/lib/database';

// Save current metrics (auto-cleans old data)
saveMetrics({
  cpu_usage: 75.5,
  memory_usage: 62.3,
  gpu_usage: 88.2,
  gpu_temperature: 72,
  active_models: 3,
  uptime: 3600,
  requests_per_minute: 42
});

// Get last 10 minutes of metrics
const history = getMetricsHistory(10); // default is 10 minutes
console.log(history); // Array of metric objects
```

### Models Management

```typescript
import { saveModel, getModels, updateModel, deleteModel } from '@/lib/database';

// Save new model
const modelId = saveModel({
  name: 'llama-3-8b',
  type: 'llama',
  status: 'running',
  ctx_size: 8192,
  temperature: 0.8,
  top_p: 0.9,
  host: '127.0.0.1',
  port: 8080,
  // ... any llama-server parameter!
});

// Get all models
const allModels = getModels();
console.log(allModels);

// Filter by status
const runningModels = getModels({ status: 'running' });

// Filter by type
const llamaModels = getModels({ type: 'llama' });

// Update existing model
updateModel(modelId, {
  status: 'stopped',
  temperature: 0.7
});

// Delete model
deleteModel(modelId);

// Delete all models
deleteAllModels();
```

### Metadata

```typescript
import { setMetadata, getMetadata, deleteMetadata } from '@/lib/database';

// Set metadata
setMetadata('server_start_time', Date.now().toString());
setMetadata('theme_preference', 'dark');

// Get metadata
const serverStart = getMetadata('server_start_time');
console.log(serverStart); // String or null

// Delete metadata
deleteMetadata('old_key');
```

### Advanced Operations

```typescript
import {
  vacuumDatabase,
  getDatabaseSize,
  exportDatabase,
  importDatabase
} from '@/lib/database';

// Vacuum database (optimize, reduce size)
vacuumDatabase();

// Get database size in bytes
const size = getDatabaseSize();
console.log(`Database size: ${size} bytes`);

// Export database to file
exportDatabase('./backup/llama-dashboard-backup.db');

// Import database from file
importDatabase('./backup/llama-dashboard-backup.db');
```

---

## Usage Pattern

### 1. Dashboard Startup

```typescript
import { initDatabase, getMetricsHistory } from '@/lib/database';

// Initialize database
initDatabase();

// Load last 10 minutes of metrics for charts
const metricsHistory = getMetricsHistory(10);
// Pass to chart components for restoration
updateCharts(metricsHistory);
```

### 2. Save Metrics on Update

```typescript
import { saveMetrics } from '@/lib/database';

// Called every time metrics are received (e.g., from WebSocket)
function handleMetricsUpdate(metrics: any) {
  saveMetrics({
    cpu_usage: metrics.cpuUsage,
    memory_usage: metrics.memoryUsage,
    disk_usage: metrics.diskUsage,
    gpu_usage: metrics.gpuUsage,
    gpu_temperature: metrics.gpuTemperature,
    gpu_memory_used: metrics.gpuMemoryUsed,
    gpu_memory_total: metrics.gpuMemoryTotal,
    gpu_power_usage: metrics.gpuPowerUsage,
    active_models: metrics.activeModels,
    uptime: metrics.uptime,
    requests_per_minute: metrics.requestsPerMinute
  });
}
```

### 3. Save Model Configuration

```typescript
import { saveModel, getModelByName, updateModel } from '@/lib/database';

// When user launches a model with custom parameters
function launchModel(name: string, params: any) {
  const existing = getModelByName(name);

  if (existing) {
    // Update existing model
    updateModel(existing.id, {
      ...params,
      status: 'running',
      updated_at: Date.now()
    });
  } else {
    // Save new model
    saveModel({
      name,
      type: detectModelType(params),
      status: 'running',
      ...params
    });
  }
}

// Example: Launch model with custom parameters
launchModel('llama-3-8b', {
  ctx_size: 16384,
  temperature: 0.6,
  top_k: 40,
  gpu_layers: -1, // auto
  flash_attn: 'auto',
  host: '127.0.0.1',
  port: 8081,
  // ... any parameter from llama-server --help
});
```

---

## Benefits

1. **Lightweight** - better-sqlite3 (~800 KB) - very small footprint
2. **Fast** - WAL mode for better write performance
3. **Synchronous** - Simple, predictable API
4. **Comprehensive** - Stores ALL llama-server parameters
5. **Auto-cleanup** - Keeps only last 10 minutes of metrics
6. **Flexible** - custom_params for future compatibility
7. **Restorable** - Metrics and models persist across refresh/restart
8. **Type-safe** - Full TypeScript support

---

## Notes

- Database file: `./data/llama-dashboard.db`
- WAL journal mode enabled for performance
- Auto-vacuum on cleanup keeps size minimal
- All llama-server parameters from `--help` included
- Flexible `custom_params` column for extensibility
