# Database Schema - Llama Dashboard

## Overview

The database has been **fully normalized** from a monolithic structure to a modular, relationship-based schema. This normalization separates concerns across multiple specialized tables, providing:

### Architecture Benefits

- **Separation of Concerns**: Each configuration type has its own dedicated table
- **Clear Relationships**: Foreign keys establish explicit 1-to-1 relationships between models and their configurations
- **Reduced Redundancy**: Eliminates data duplication across model entries
- **Easier Maintenance**: Schema changes can be made to specific config types without affecting others
- **Independent Server Config**: Global server settings are stored separately without dependency on models
- **Lazy Loading Performance**: Can fetch core model data first, then load specific configs as needed

### Database Version

**Current Schema Version**: 2.0 (normalized architecture)

---

## Installation

```bash
pnpm add -D better-sqlite3 @types/better-sqlite3
```

## Database Location

```
./data/llama-dashboard.db
```

---

## Schema Diagram

### Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA v2.0                                 │
│                          (Normalized Architecture)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐       FK (CASCADE)        ┌─────────────────────────┐     │
│  │   models     │◄─────────────────────────┤ model_sampling_config   │     │
│  │ (26 fields)  │                          │ (36 fields)             │     │
│  └──────┬───────┘                          └─────────────────────────┘     │
│         │                                                                     │
│         │ FK (CASCADE)  FK (CASCADE)  FK (CASCADE)                           │
│         ├───────────────┼───────────────┼───────────────┐                   │
│         ▼               ▼               ▼               ▼                   │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │  model_memory │ │ model_gpu   │ │ model_      │ │ model_lora   │      │
│  │  _config     │ │ _config     │ │ advanced_    │ │ _config      │      │
│  │ (8 fields)    │ │ (10 fields) │ │ config      │ │ (21 fields)   │      │
│  └───────────────┘ └──────────────┘ │ (22 fields) │ └──────────────┘      │
│                                     └──────────────┘                       │
│                                                                            │
│  ┌──────────────┐                                                          │
│  │ model_       │                                                          │
│  │ multimodal_  │                                                          │
│  │ config       │                                                          │
│  │ (7 fields)   │                                                          │
│  └──────────────┘
│                                                                            │
│  ┌────────────────────────────────────────────┐                            │
│  │ model_server_config                        │                            │
│  │ (INDEPENDENT - NO FK to models)            │                            │
│  │ (38 fields)                                │                            │
│  └────────────────────────────────────────────┘                            │
│                                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  SUPPORTING TABLES                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐          ┌──────────────┐                               │
│  │ metrics_     │          │  metadata    │                               │
│  │ history      │          │  table       │                               │
│  │ (13 fields)  │          │ (3 fields)   │                               │
│  └──────────────┘          └──────────────┘                               │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

LEGEND:
  ───────────  One-to-One Relationship (1:1)
  FK          Foreign Key with CASCADE DELETE
  () fields   Number of columns in table
```

### Relationship Summary

| Table | Related Tables | Relationship | Cascade Delete |
|-------|----------------|--------------|----------------|
| `models` | `model_sampling_config` | 1:1 | ✓ Yes |
| `models` | `model_memory_config` | 1:1 | ✓ Yes |
| `models` | `model_gpu_config` | 1:1 | ✓ Yes |
| `models` | `model_advanced_config` | 1:1 | ✓ Yes |
| `models` | `model_lora_config` | 1:1 | ✓ Yes |
| `models` | `model_multimodal_config` | 1:1 | ✓ Yes |
| `models` | `model_fit_params` | 1:1 | ✓ Yes |
| `model_server_config` | None (Independent) | N/A | N/A |

---

## Table Definitions

### 1. `models` Table (Core Model)

Stores essential model information and core configuration. This is the parent table for all model-specific configurations.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique model identifier |
| `name` | TEXT | NOT NULL | - | Model name (unique identifier) |
| `type` | TEXT | NOT NULL | - | Model type: 'llama', 'gpt', 'mistral', 'custom' |
| `status` | TEXT | NOT NULL, CHECK | - | Status: 'running', 'stopped', 'loading', 'error' |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when model was added |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when model was last modified |
| **Model Path & Loading** | | | | |
| `model_path` | TEXT | NULL | NULL | Path to model file on disk |
| `model_url` | TEXT | NULL | NULL | Model download URL |
| `docker_repo` | TEXT | NULL | NULL | Docker Hub repository (<repo>/<model>[:quant]) |
| `hf_repo` | TEXT | NULL | NULL | Hugging Face repository (<user>/<model>[:quant]) |
| `hf_repo_draft` | TEXT | NULL | NULL | Hugging Face draft model repository |
| `hf_file` | TEXT | NULL | NULL | Hugging Face model file |
| `hf_file_v` | TEXT | NULL | NULL | Hugging Face vocoder model file |
| `hf_token` | TEXT | NULL | NULL | Hugging Face access token |
| **Context & Processing** | | | | |
| `ctx_size` | INTEGER | - | 0 | Context window size (0 = from model) |
| `predict` | INTEGER | - | -1 | Number of tokens to predict (-1 = infinity) |
| `batch_size` | INTEGER | - | 2048 | Logical maximum batch size |
| `ubatch_size` | INTEGER | - | 512 | Physical maximum batch size |
| `n_parallel` | INTEGER | - | -1 | Number of server slots (-1 = auto) |
| `cont_batching` | INTEGER | - | 0 | Continuous batching (0=disabled, 1=enabled) |
| **Threading** | | | | |
| `threads` | INTEGER | - | -1 | CPU threads for generation (-1 = auto) |
| `threads_batch` | INTEGER | NULL | NULL | Threads for batch processing |
| `cpu_mask` | TEXT | NULL | NULL | CPU affinity mask (hex string) |
| `cpu_range` | TEXT | NULL | NULL | CPU range for affinity (e.g., "0-7") |
| `cpu_strict` | INTEGER | - | 0 | Strict CPU placement (0 or 1) |
| `cpu_mask_batch` | TEXT | NULL | NULL | CPU affinity mask for batch (hex string) |
| `cpu_range_batch` | TEXT | NULL | NULL | CPU range for batch |
| `cpu_strict_batch` | INTEGER | - | 0 | Strict CPU placement for batch (0 or 1) |
| `priority` | INTEGER | - | 0 | Process priority (-1=low, 0=normal, 1=medium, 2=high, 3=realtime) |
| `priority_batch` | INTEGER | NULL | NULL | Priority for batch |
| **Fit-params Tracking** | | | |
| `file_size_bytes` | INTEGER | NULL | NULL | Model file size in bytes |
| `fit_params_available` | INTEGER | - | 0 | Whether fit-params have been analyzed (0=no, 1=yes) |
| `last_fit_params_check` | INTEGER | NULL | NULL | Unix timestamp of last fit-params check |

**Indexes:**
- `idx_models_name` - On `name` for fast lookups
- `idx_models_status` - On `status` for filtering
- `idx_models_type` - On `type` for filtering
- `idx_models_created` - On `created_at` for sorting

---

### 2. `model_sampling_config` Table

Stores sampling parameters and generation settings. Linked to `models` via foreign key.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique configuration identifier |
| `model_id` | INTEGER | NOT NULL, FK → models(id) | - | Parent model ID |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when created |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when last modified |
| **Temperature & Sampling** | | | | |
| `temperature` | REAL | - | 0.8 | Sampling temperature (0.0 = deterministic, higher = more random) |
| `top_k` | INTEGER | - | 40 | Top-k sampling (0 = disabled) |
| `top_p` | REAL | - | 0.9 | Top-p sampling (1.0 = disabled) |
| `min_p` | REAL | - | 0.1 | Min-p sampling (0.0 = disabled) |
| `top_nsigma` | REAL | - | -1.0 | Top-n sigma (-1.0 = disabled) |
| `xtc_probability` | REAL | - | 0.0 | XTC probability (0.0 = disabled) |
| `xtc_threshold` | REAL | - | 0.1 | XTC threshold (1.0 = disabled) |
| `typical_p` | REAL | - | 1.0 | Locally typical sampling (1.0 = disabled) |
| **Repeat & Penalties** | | | | |
| `repeat_last_n` | INTEGER | - | 64 | Last n tokens for repeat penalty |
| `repeat_penalty` | REAL | - | 1.0 | Repeat penalty (1.0 = disabled) |
| `presence_penalty` | REAL | - | 0.0 | Presence penalty (0.0 = disabled) |
| `frequency_penalty` | REAL | - | 0.0 | Frequency penalty (0.0 = disabled) |
| `dry_multiplier` | REAL | - | 0.0 | DRY multiplier (0.0 = disabled) |
| `dry_base` | REAL | - | 1.75 | DRY base |
| `dry_allowed_length` | INTEGER | - | 2 | DRY allowed length |
| `dry_penalty_last_n` | INTEGER | - | -1 | DRY penalty for last n tokens |
| `dry_sequence_breaker` | TEXT | NULL | NULL | DRY sequence breaker (string or "none") |
| **Dynamic Temperature** | | | | |
| `dynatemp_range` | REAL | - | 0.0 | Dynamic temperature range (0.0 = disabled) |
| `dynatemp_exp` | REAL | - | 1.0 | Dynamic temperature exponent |
| **Mirostat** | | | | |
| `mirostat` | INTEGER | - | 0 | Mirostat sampling (0=disabled, 1=enabled, 2=Mirostat2.0) |
| `mirostat_lr` | REAL | - | 0.1 | Mirostat learning rate |
| `mirostat_ent` | REAL | - | 5.0 | Mirostat target entropy |
| **Samplers** | | | | |
| `samplers` | TEXT | NULL | NULL | Custom samplers sequence (semicolon-separated) |
| `sampler_seq` | TEXT | - | 'edskypmxt' | Simplified sampler sequence |
| `seed` | INTEGER | - | -1 | RNG seed (-1 = random) |
| **Grammar & Constraints** | | | | |
| `grammar` | TEXT | NULL | NULL | BNF grammar constraint |
| `grammar_file` | TEXT | NULL | NULL | Grammar file path |
| `json_schema` | TEXT | NULL | NULL | JSON schema constraint |
| `json_schema_file` | TEXT | NULL | NULL | JSON schema file |
| `ignore_eos` | INTEGER | - | 1 | Ignore end of stream token (0 or 1) |
| `escape` | BOOLEAN | - | 1 | Process escapes |
| **RoPE & Attention** | | | | |
| `rope_scaling_type` | TEXT | NULL | NULL | RoPE scaling (none, linear, yarn) |
| `rope_scale` | REAL | NULL | NULL | RoPE context scaling factor |
| `rope_freq_base` | REAL | NULL | NULL | RoPE base frequency |
| `rope_freq_scale` | REAL | NULL | NULL | RoPE frequency scaling factor |
| `yarn_orig_ctx` | INTEGER | - | 0 | YaRN original context size |
| `yarn_ext_factor` | REAL | - | -1.0 | YaRN extrapolation mix factor |
| `yarn_attn_factor` | REAL | - | -1.0 | YaRN attention magnitude |
| `yarn_beta_slow` | REAL | - | -1.0 | YaRN high correction dim |
| `yarn_beta_fast` | REAL | - | -1.0 | YaRN low correction dim |
| `flash_attn` | TEXT | - | 'auto' | Flash attention (on, off, auto) |
| `logit_bias` | TEXT | NULL | NULL | Logit bias (TOKEN_ID(+/-)BIAS,...) |

**Indexes:**
- `idx_sampling_model_id` - On `model_id` for fast lookups

**Foreign Key:**
- `model_id` → `models(id)` ON DELETE CASCADE

---

### 3. `model_memory_config` Table

Stores memory management and caching settings. Linked to `models` via foreign key.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique configuration identifier |
| `model_id` | INTEGER | NOT NULL, FK → models(id) | - | Parent model ID |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when created |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when last modified |
| **Cache Settings** | | | | |
| `cache_ram` | INTEGER | - | -1 | Max cache size in MiB (-1 = no limit) |
| `cache_type_k` | TEXT | NULL | NULL | KV cache type for K (f32, f16, bf16, q8_0, etc.) |
| `cache_type_v` | TEXT | NULL | NULL | KV cache type for V (f32, f16, bf16, q8_0, etc.) |
| **Memory Management** | | | | |
| `mmap` | INTEGER | - | 0 | Memory-map model (0=disabled, 1=enabled) |
| `mlock` | INTEGER | - | 0 | Keep model in RAM (0=disabled, 1=enabled) |
| `numa` | TEXT | NULL | NULL | NUMA optimization (distribute, isolate, numactl) |
| `defrag_thold` | INTEGER | NULL | NULL | KV cache defrag threshold (DEPRECATED) |

**Indexes:**
- `idx_memory_model_id` - On `model_id` for fast lookups

**Foreign Key:**
- `model_id` → `models(id)` ON DELETE CASCADE

---

### 4. `model_gpu_config` Table

Stores GPU offloading and device configuration. Linked to `models` via foreign key.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique configuration identifier |
| `model_id` | INTEGER | NOT NULL, FK → models(id) | - | Parent model ID |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when created |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when last modified |
| **Device Configuration** | | | | |
| `device` | TEXT | NULL | NULL | Device list for offloading (e.g., "0,1") |
| `list_devices` | INTEGER | - | 0 | Print available devices (0 or 1) |
| **GPU Offloading** | | | | |
| `gpu_layers` | INTEGER | - | -1 | Max layers in VRAM (-1=auto, 'all', or number) |
| `split_mode` | TEXT | NULL | NULL | Split mode (none, layer, row) |
| `tensor_split` | TEXT | NULL | NULL | Fraction per GPU (e.g., "3,1") |
| `main_gpu` | INTEGER | NULL | NULL | Main GPU index |
| `kv_offload` | INTEGER | - | 0 | KV cache offloading (0=disabled, 1=enabled) |
| **Advanced GPU** | | | | |
| `repack` | INTEGER | - | 0 | Enable weight repacking (0=disabled, 1=enabled) |
| `no_host` | INTEGER | - | 0 | Bypass host buffer (0=disabled, 1=enabled) |

**Indexes:**
- `idx_gpu_model_id` - On `model_id` for fast lookups

**Foreign Key:**
- `model_id` → `models(id)` ON DELETE CASCADE

---

### 5. `model_advanced_config` Table

Stores advanced options and experimental features. Linked to `models` via foreign key.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique configuration identifier |
| `model_id` | INTEGER | NOT NULL, FK → models(id) | - | Parent model ID |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when created |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when last modified |
| **Advanced Memory** | | | | |
| `swa_full` | INTEGER | - | 0 | Full-size SWA cache (0=disabled, 1=enabled) |
| `override_tensor` | TEXT | NULL | NULL | Override tensor buffer type |
| `cpu_moe` | INTEGER | - | 0 | Keep all MoE weights in CPU (0 or 1) |
| `n_cpu_moe` | INTEGER | - | 0 | Keep MoE weights of first N layers in CPU |
| `kv_unified` | INTEGER | - | 0 | Unified KV buffer (0=disabled, 1=enabled) |
| **Processing Options** | | | | |
| `pooling` | TEXT | NULL | NULL | Pooling type (none, mean, cls, last, rank) |
| `context_shift` | INTEGER | - | 0 | Context shift (0 or 1) |
| `rpc` | TEXT | NULL | NULL | RPC servers list |
| `offline` | INTEGER | - | 0 | Offline mode (0 or 1) |
| `override_kv` | TEXT | NULL | NULL | Override model metadata (KEY=TYPE:VALUE,...) |
| `op_offload` | INTEGER | - | 0 | Offload host tensor ops (0 or 1) |
| **Fit Optimization** | | | | |
| `fit` | TEXT | NULL | NULL | Fit arguments (on, off) |
| `fit_target` | INTEGER | - | 1024 | Fit target MiB |
| `fit_ctx` | INTEGER | - | 4096 | Fit minimum ctx size |
| **Validation & Performance** | | | | |
| `check_tensors` | INTEGER | - | 0 | Check model tensor data (0 or 1) |
| `sleep_idle_seconds` | INTEGER | - | -1 | Sleep idle seconds |
| `polling` | TEXT | NULL | NULL | Polling level (0-100) |
| `polling_batch` | TEXT | NULL | NULL | Polling for batch (0 or 1) |
| **Reasoning** | | | | |
| `reasoning_format` | TEXT | NULL | NULL | Reasoning format (none, deepseek, deepseek-legacy, auto) |
| `reasoning_budget` | INTEGER | - | -1 | Reasoning budget (-1=unrestricted, 0=disabled) |
| **Custom** | | | | |
| `custom_params` | TEXT | NULL | NULL | Additional parameters as JSON (flexible) |

**Indexes:**
- `idx_advanced_model_id` - On `model_id` for fast lookups

**Foreign Key:**
- `model_id` → `models(id)` ON DELETE CASCADE

---

### 6. `model_lora_config` Table

Stores LoRA (Low-Rank Adaptation) adapter settings and draft model configurations. Linked to `models` via foreign key.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique configuration identifier |
| `model_id` | INTEGER | NOT NULL, FK → models(id) | - | Parent model ID |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when created |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when last modified |
| **LoRA Adapters** | | | | |
| `lora` | TEXT | NULL | NULL | LoRA adapter path |
| `lora_scaled` | TEXT | NULL | NULL | LoRA with scaling (FNAME:SCALE,...) |
| `control_vector` | TEXT | NULL | NULL | Control vector file |
| `control_vector_scaled` | TEXT | NULL | NULL | Control vector with scaling (FNAME:SCALE,...) |
| `control_vector_layer_range` | TEXT | NULL | NULL | Layer range for control vector |
| **Draft Model (Speculative Decoding)** | | | | |
| `model_draft` | TEXT | NULL | NULL | Draft model path |
| `model_url_draft` | TEXT | NULL | NULL | Draft model download URL |
| `ctx_size_draft` | INTEGER | NULL | NULL | Draft model context size |
| `threads_draft` | INTEGER | NULL | NULL | Draft model threads |
| `threads_batch_draft` | INTEGER | NULL | NULL | Draft model threads for batch |
| `draft_max` | INTEGER | - | 16 | Max draft tokens |
| `draft_min` | INTEGER | - | 0 | Min draft tokens |
| `draft_p_min` | REAL | - | 0.8 | Min draft probability |
| **Draft Model Config** | | | | |
| `cache_type_k_draft` | TEXT | NULL | NULL | KV cache type for draft model K |
| `cache_type_v_draft` | TEXT | NULL | NULL | KV cache type for draft model V |
| `cpu_moe_draft` | INTEGER | - | 0 | CPU MoE for draft model |
| `n_cpu_moe_draft` | INTEGER | - | 0 | MoE weights in CPU for first N layers (draft) |
| `n_gpu_layers_draft` | INTEGER | NULL | NULL | GPU layers for draft model |
| `device_draft` | TEXT | NULL | NULL | Device list for draft model |
| `spec_replace` | TEXT | NULL | NULL | Translate string in TARGET to DRAFT |

**Indexes:**
- `idx_lora_model_id` - On `model_id` for fast lookups

**Foreign Key:**
- `model_id` → `models(id)` ON DELETE CASCADE

---

### 7. `model_multimodal_config` Table

Stores multimodal settings for vision and image processing. Linked to `models` via foreign key.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique configuration identifier |
| `model_id` | INTEGER | NOT NULL, FK → models(id) | - | Parent model ID |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when created |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when last modified |
| **Multimodal Projector** | | | | |
| `mmproj` | TEXT | NULL | NULL | Multimodal projector file |
| `mmproj_url` | TEXT | NULL | NULL | Multimodal projector URL |
| `mmproj_auto` | INTEGER | - | 0 | Auto-load multimodal projector (0 or 1) |
| `mmproj_offload` | INTEGER | - | 0 | GPU offload for multimodal projector (0 or 1) |
| **Image Processing** | | | | |
| `image_min_tokens` | INTEGER | NULL | NULL | Min tokens per image |
| `image_max_tokens` | INTEGER | NULL | NULL | Max tokens per image |

**Indexes:**
- `idx_multimodal_model_id` - On `model_id` for fast lookups

**Foreign Key:**
- `model_id` → `models(id)` ON DELETE CASCADE

---

### 7. `model_fit_params` Table

Stores fit-params analysis results for automatic parameter optimization. Linked to `models` via foreign key.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique configuration identifier |
| `model_id` | INTEGER | NOT NULL, UNIQUE, FK → models(id) | - | Parent model ID |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when created |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when last modified |
| **Fit-params Results** | | | |
| `recommended_ctx_size` | INTEGER | NULL | NULL | Recommended context window size |
| `recommended_gpu_layers` | INTEGER | NULL | NULL | Recommended GPU layers to offload |
| `recommended_tensor_split` | TEXT | NULL | NULL | Recommended tensor split (e.g., "3,1") |
| **Model Metadata** | | | |
| `file_size_bytes` | INTEGER | NULL | NULL | Model file size in bytes |
| `quantization_type` | TEXT | NULL | NULL | Quantization type (e.g., "Q4_K_M") |
| `parameter_count` | INTEGER | NULL | NULL | Total parameter count |
| `architecture` | TEXT | NULL | NULL | Model architecture (e.g., "llama", "mistral") |
| `context_window` | INTEGER | NULL | NULL | Native context window size |
| **Analysis Metadata** | | | |
| `fit_params_analyzed_at` | INTEGER | NULL | NULL | Unix timestamp of last analysis |
| `fit_params_success` | INTEGER | - | 0 | Analysis success flag (0=failed, 1=success) |
| `fit_params_error` | TEXT | NULL | NULL | Error message if analysis failed |
| `fit_params_raw_output` | TEXT | NULL | NULL | Raw fit-params command output |
| **Memory Projections** | | | |
| `projected_cpu_memory_mb` | REAL | NULL | NULL | Projected CPU memory usage (MB) |
| `projected_gpu_memory_mb` | REAL | NULL | NULL | Projected GPU memory usage (MB) |

**Indexes:**
- `idx_fit_params_model_id` - On `model_id` for fast lookups

**Foreign Key:**
- `model_id` → `models(id)` ON DELETE CASCADE

---

### 8. `model_server_config` Table

Stores **independent global server settings**. This table has **NO foreign key to models** and represents server-wide defaults that apply regardless of which models are running.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| **Identity** | | | | |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Unique configuration identifier |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when created |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when last modified |
| **Server Connection** | | | | |
| `host` | TEXT | - | '127.0.0.1' | Server host |
| `port` | INTEGER | - | 8080 | Server port |
| `api_prefix` | TEXT | NULL | NULL | API prefix path |
| `path` | TEXT | NULL | NULL | Static files path |
| **WebUI Configuration** | | | | |
| `webui` | TEXT | NULL | NULL | WebUI config JSON |
| `webui_config_file` | TEXT | NULL | NULL | WebUI config file path |
| `no_webui` | INTEGER | - | 0 | Disable WebUI (0 or 1) |
| **Endpoints** | | | | |
| `embeddings` | INTEGER | - | 0 | Enable embeddings only (0 or 1) |
| `reranking` | INTEGER | - | 0 | Enable reranking endpoint (0 or 1) |
| `metrics_enabled` | INTEGER | - | 1 | Enable metrics endpoint (0 or 1) |
| `props_enabled` | INTEGER | - | 0 | Enable props endpoint (0 or 1) |
| `slots_enabled` | INTEGER | - | 0 | Enable slots endpoint (0 or 1) |
| **Authentication** | | | | |
| `api_key` | TEXT | NULL | NULL | API key for authentication |
| `api_key_file` | TEXT | NULL | NULL | API key file path |
| `ssl_key_file` | TEXT | NULL | NULL | SSL private key file |
| `ssl_cert_file` | TEXT | NULL | NULL | SSL certificate file |
| **Timeout & Threading** | | | | |
| `timeout` | INTEGER | - | 600 | Server timeout in seconds |
| `threads_http` | INTEGER | NULL | NULL | HTTP request threads |
| `cache_reuse` | INTEGER | NULL | NULL | Cache reuse chunk size |
| **Slots & Caching** | | | | |
| `slot_save_path` | TEXT | NULL | NULL | Save slot KV cache path |
| **Paths** | | | | |
| `media_path` | TEXT | NULL | NULL | Media files directory |
| `models_dir` | TEXT | NULL | NULL | Models directory |
| `models_preset` | TEXT | NULL | NULL | Models preset file |
| **Model Loading** | | | | |
| `models_max` | INTEGER | - | 4 | Max models to load (0=unlimited) |
| `models_autoload` | INTEGER | - | 0 | Auto-load models (0 or 1) |
| **Chat Templates** | | | | |
| `jinja` | INTEGER | - | 0 | Use jinja template (0 or 1) |
| `chat_template` | TEXT | NULL | NULL | Custom jinja chat template |
| `chat_template_file` | TEXT | NULL | NULL | Custom jinja template file |
| `chat_template_kwargs` | TEXT | NULL | NULL | JSON template parser params |
| `prefill_assistant` | INTEGER | - | 0 | Prefill assistant response (0 or 1) |
| **Advanced** | | | | |
| `ctx_checkpoints` | INTEGER | - | 8 | Max context checkpoints |
| `verbose_prompt` | INTEGER | - | 0 | Print verbose prompt (0 or 1) |
| `warmup` | INTEGER | - | 0 | Perform warmup (0 or 1) |
| `spm_infill` | INTEGER | - | 0 | Use Suffix/Prefix/Middle pattern (0 or 1) |
| **Logging** | | | | |
| `log_disable` | INTEGER | NULL | NULL | Disable logging (0 or 1) |
| `log_file` | TEXT | NULL | NULL | Log to file path |
| `log_colors` | TEXT | NULL | NULL | Log colors (on, off, auto) |
| `log_verbose` | INTEGER | - | 0 | Verbosity level (0-4, infinity) |
| `log_prefix` | INTEGER | - | 0 | Enable log prefix (0 or 1) |
| `log_timestamps` | INTEGER | - | 0 | Enable log timestamps (0 or 1) |

**Important Note:** This table is independent and stores global server defaults. It does not have a foreign key to `models`. There is typically only **one row** in this table that serves as the global server configuration.

---

### 9. `metrics_history` Table

Stores the last 10 minutes of all chart metrics for restoration on refresh/relaunch. (Unchanged from previous schema)

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | - | Auto-increment primary key |
| `timestamp` | INTEGER | NOT NULL | - | Unix timestamp in milliseconds |
| `cpu_usage` | REAL | NOT NULL | - | CPU usage percentage (0-100) |
| `memory_usage` | REAL | NOT NULL | - | Memory usage percentage (0-100) |
| `disk_usage` | REAL | NOT NULL | - | Disk usage percentage (0-100) |
| `gpu_usage` | REAL | NOT NULL | - | GPU usage percentage (0-100) |
| `gpu_temperature` | REAL | NOT NULL | - | GPU temperature in °C |
| `gpu_memory_used` | REAL | NOT NULL | - | GPU memory used in MB |
| `gpu_memory_total` | REAL | NOT NULL | - | GPU memory total in MB |
| `gpu_power_usage` | REAL | NOT NULL | - | GPU power usage in watts |
| `active_models` | INTEGER | NOT NULL | - | Number of active models |
| `uptime` | INTEGER | NOT NULL | - | Server uptime in seconds |
| `requests_per_minute` | REAL | NOT NULL | - | Requests per minute |
| `created_at` | INTEGER | NOT NULL | - | Unix timestamp when record was created |

**Indexes:**
- `idx_metrics_timestamp` - On `timestamp` for fast time-based queries
- `idx_metrics_created_at` - On `created_at` for cleanup

**Retention:**
- Automatic cleanup of records older than 10 minutes on every insert
- Keeps database size minimal

---

### 10. `metadata` Table

Stores dashboard global state and configuration. (Unchanged from previous schema)

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `key` | TEXT | PRIMARY KEY, NOT NULL | - | Metadata key |
| `value` | TEXT | NOT NULL | - | Metadata value |
| `updated_at` | INTEGER | NOT NULL | - | Unix timestamp when updated |

**Predefined Keys:**
- `db_version` - Database schema version (currently '2.0')
- `server_start_time` - Server start timestamp
- `last_metrics_save` - Last metrics save timestamp
- `theme_preference` - User theme preference
- Any custom keys for flexibility

---

## Relationships

### One-to-One Relationships

Each model has **exactly one** configuration in each of the following tables:

```
models (1) ────────── (1) model_sampling_config
models (1) ────────── (1) model_memory_config
models (1) ────────── (1) model_gpu_config
models (1) ────────── (1) model_advanced_config
models (1) ────────── (1) model_lora_config
models (1) ────────── (1) model_multimodal_config
```

### Cascade Delete Behavior

When a model is deleted from the `models` table:
- All related configuration records in config tables are automatically deleted
- This is enforced by `ON DELETE CASCADE` foreign key constraints
- Ensures no orphaned configuration records exist

### Independent Server Configuration

The `model_server_config` table is **completely independent**:
- No foreign key to `models`
- Exists as a singleton (typically one row)
- Contains global server defaults that apply to all models
- Can be updated independently of model operations
- Persists even if all models are deleted

---

## Migration Notes

### From Denormalized (v1.x) to Normalized (v2.0)

The migration from a single 176-column `models` table to the normalized schema involves:

#### Data Mapping

| Old Schema (Single Table) | New Schema (Normalized) |
|--------------------------|------------------------|
| Core fields (id, name, type, status, etc.) | `models` table |
| temperature, top_p, top_k, sampling params | `model_sampling_config` |
| cache_ram, mmap, mlock, numa | `model_memory_config` |
| gpu_layers, device, tensor_split | `model_gpu_config` |
| swa_full, pooling, rpc, offline | `model_advanced_config` |
| lora, control_vector, draft params | `model_lora_config` |
| mmproj, image_min_tokens | `model_multimodal_config` |
| host, port, timeout, logging | `model_server_config` (independent) |

#### Migration Steps

1. **Backup existing database**
   ```bash
   cp data/llama-dashboard.db data/llama-dashboard-backup.db
   ```

2. **Create new normalized tables** (handled automatically by `initDatabase()`)

3. **Migrate existing models**
   - Extract core fields → insert into `models`
   - Extract sampling fields → insert into `model_sampling_config` with `model_id`
   - Repeat for each config type
   - Extract server settings → insert into `model_server_config` (once)

4. **Validate data integrity**
   - Verify all models have their configs
   - Check foreign key relationships
   - Test cascade delete behavior

5. **Drop old denormalized table** (if separate migration script used)

#### Benefits of Migration

- **Easier to maintain**: Changes to sampling parameters don't affect memory config
- **Clear separation**: Each config type has a dedicated interface
- **Better performance**: Can lazy-load specific configs as needed
- **Reduced redundancy**: Default values don't need to be stored per model
- **Type safety**: Each config has its own TypeScript interface
- **Flexible querying**: Can query specific config types without loading all fields

---

## API Usage

### Initialization

```typescript
import { initDatabase, closeDatabase } from '@/lib/database';

// Initialize database (creates tables if needed)
const db = initDatabase();

// When app closes
closeDatabase(db);
```

### Models Management

#### Save a Model with Complete Configuration

```typescript
import {
  saveModel,
  saveModelSamplingConfig,
  saveModelMemoryConfig,
  saveModelGpuConfig,
  saveModelAdvancedConfig,
  saveModelLoraConfig,
  saveModelMultimodalConfig
} from '@/lib/database';

// Step 1: Save core model
const modelId = saveModel({
  name: 'llama-3-8b',
  type: 'llama',
  status: 'running',
  model_path: '/models/llama-3-8b.gguf',
  ctx_size: 8192,
  batch_size: 2048,
  threads: -1
});

// Step 2: Save sampling configuration
saveModelSamplingConfig(modelId, {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  min_p: 0.1,
  repeat_penalty: 1.1,
  presence_penalty: 0.0,
  frequency_penalty: 0.0
});

// Step 3: Save memory configuration
saveModelMemoryConfig(modelId, {
  cache_ram: -1,
  mmap: 1,
  mlock: 0,
  cache_type_k: 'f16',
  cache_type_v: 'f16'
});

// Step 4: Save GPU configuration
saveModelGpuConfig(modelId, {
  gpu_layers: -1,
  device: '0',
  tensor_split: null,
  split_mode: 'layer'
});

// Step 5: Save advanced configuration
saveModelAdvancedConfig(modelId, {
  flash_attn: 'auto',
  pooling: 'none',
  context_shift: 1
});

// Step 6: Save LoRA configuration (optional)
saveModelLoraConfig(modelId, {
  lora: null,
  control_vector: null
});

// Step 7: Save multimodal configuration (optional)
saveModelMultimodalConfig(modelId, {
  mmproj: null
});
```

#### Lazy-Load Specific Configs Only

```typescript
import {
  getModelById,
  getModelSamplingConfig,
  getModelMemoryConfig
} from '@/lib/database';

// Get core model data only
const model = getModelById(modelId);
console.log(model.name, model.status);

// Load sampling config only when needed
const sampling = getModelSamplingConfig(modelId);
if (sampling) {
  console.log('Temperature:', sampling.temperature);
  console.log('Top-p:', sampling.top_p);
}

// Load memory config only when needed
const memory = getModelMemoryConfig(modelId);
if (memory) {
  console.log('Cache RAM:', memory.cache_ram);
  console.log('MMap enabled:', memory.mmap);
}
```

#### Get Complete Model Configuration

```typescript
import { getCompleteModelConfig } from '@/lib/database';

// Get model with all its configs in one call
const complete = getCompleteModelConfig(modelId);

if (complete) {
  console.log('Model:', complete.model.name);
  console.log('Sampling:', complete.sampling?.temperature);
  console.log('Memory:', complete.memory?.cache_ram);
  console.log('GPU:', complete.gpu?.gpu_layers);
  console.log('Advanced:', complete.advanced?.pooling);
  console.log('LoRA:', complete.lora?.lora);
  console.log('Multimodal:', complete.multimodal?.mmproj);
}
```

#### Update Model and Specific Configs

```typescript
import {
  updateModel,
  updateModelSamplingConfig,
  getModelSamplingConfig
} from '@/lib/database';

// Update model status
updateModel(modelId, {
  status: 'stopped',
  updated_at: Date.now()
});

// Update sampling temperature
const currentSampling = getModelSamplingConfig(modelId);
if (currentSampling) {
  updateModelSamplingConfig(modelId, {
    temperature: 0.5, // Lower temperature
    top_p: 0.95
  });
}
```

#### Delete Model (Cascades to All Configs)

```typescript
import { deleteModel } from '@/lib/database';

// Deletes model and ALL related configs automatically
deleteModel(modelId);
// model_sampling_config, model_memory_config, model_gpu_config,
// model_advanced_config, model_lora_config, model_multimodal_config
// are all deleted automatically due to CASCADE
```

### Server Configuration (Independent)

```typescript
import { saveServerConfig, getServerConfig } from '@/lib/database';

// Save/update global server config
saveServerConfig({
  host: '127.0.0.1',
  port: 8080,
  timeout: 600,
  metrics_enabled: 1,
  models_max: 4,
  log_verbose: 1,
  log_file: '/var/log/llama-server.log'
});

// Get server config (returns single row or null)
const serverConfig = getServerConfig();
if (serverConfig) {
  console.log('Server host:', serverConfig.host);
  console.log('Server port:', serverConfig.port);
  console.log('Timeout:', serverConfig.timeout);
}

// Update server config (replaces existing)
saveServerConfig({
  ...serverConfig, // preserve existing values
  port: 8081 // update only port
});
```

### Metrics History

```typescript
import { saveMetrics, getMetricsHistory, getLatestMetrics } from '@/lib/database';

// Save current metrics (auto-cleans old data)
saveMetrics({
  cpu_usage: 75.5,
  memory_usage: 62.3,
  gpu_usage: 88.2,
  gpu_temperature: 72,
  gpu_memory_used: 8192,
  gpu_memory_total: 16384,
  gpu_power_usage: 250,
  active_models: 3,
  uptime: 3600,
  requests_per_minute: 42
});

// Get last 10 minutes of metrics
const history = getMetricsHistory(10); // default is 10 minutes
console.log(history); // Array of metric objects

// Get latest metrics only
const latest = getLatestMetrics();
if (latest) {
  console.log('Current CPU:', latest.cpu_usage);
}
```

### Metadata

```typescript
import { setMetadata, getMetadata, deleteMetadata } from '@/lib/database';

// Set metadata
setMetadata('server_start_time', Date.now().toString());
setMetadata('theme_preference', 'dark');
setMetadata('db_version', '2.0');

// Get metadata
const serverStart = getMetadata('server_start_time');
console.log(serverStart); // String or null

const dbVersion = getMetadata('db_version');
console.log('Database version:', dbVersion); // '2.0'

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

### 1. Dashboard Startup - Restore Metrics

```typescript
import { initDatabase, getMetricsHistory, getServerConfig } from '@/lib/database';

// Initialize database
const db = initDatabase();

// Load last 10 minutes of metrics for charts
const metricsHistory = getMetricsHistory(10);
// Pass to chart components for restoration
updateCharts(metricsHistory);

// Load server config
const serverConfig = getServerConfig();
if (serverConfig) {
  applyServerSettings(serverConfig);
}
```

### 2. Load Models List (Lazy Loading)

```typescript
import { getModels } from '@/lib/database';

// Get only core model data for list view
const models = getModels({ status: 'running' });
console.log('Running models:', models.map(m => m.name));

// Display in UI without loading all configs
models.forEach(model => {
  console.log(`${model.name} (${model.type}) - ${model.status}`);
});

// Load specific config when user clicks "Configure" button
const handleConfigure = (modelId: number) => {
  const sampling = getModelSamplingConfig(modelId);
  showSamplingDialog(sampling);
};
```

### 3. Save Model Configuration (Complete)

```typescript
import { saveModel, saveModelSamplingConfig, /* ... */ } from '@/lib/database';

// When user launches a model with custom parameters
function launchModel(name: string, params: LaunchParams) {
  // Check if model exists
  const existing = getModelByName(name);

  if (existing) {
    // Update existing model status
    updateModel(existing.id, { status: 'running' });

    // Update specific configs as needed
    updateModelSamplingConfig(existing.id, {
      temperature: params.temperature,
      top_p: params.top_p
    });
  } else {
    // Create new model with all configs
    const modelId = saveModel({
      name,
      type: detectModelType(params),
      status: 'running',
      model_path: params.modelPath,
      ctx_size: params.ctxSize,
      batch_size: params.batchSize
    });

    // Save all configurations
    saveModelSamplingConfig(modelId, params.sampling);
    saveModelMemoryConfig(modelId, params.memory);
    saveModelGpuConfig(modelId, params.gpu);
    saveModelAdvancedConfig(modelId, params.advanced);
    saveModelLoraConfig(modelId, params.lora);
    saveModelMultimodalConfig(modelId, params.multimodal);
  }

  // Update server config if needed
  saveServerConfig({
    ...getServerConfig(),
    timeout: params.timeout,
    metrics_enabled: 1
  });
}
```

### 4. Delete Model and Clean Up

```typescript
import { deleteModel } from '@/lib/database';

// Delete model - all configs cascade automatically
function removeModel(modelId: number) {
  if (confirm('Delete this model and all its configurations?')) {
    deleteModel(modelId);
    console.log('Model and all configs deleted');
    // No need to delete configs separately!
  }
}
```

---

## Benefits of Normalized Schema

### 1. Maintainability
- **Clear separation**: Each config type has its own table
- **Targeted updates**: Change sampling params without touching memory config
- **Easier migrations**: Schema changes are localized to specific tables

### 2. Performance
- **Lazy loading**: Fetch core model data first, then load configs as needed
- **Smaller queries**: Query only the fields you need
- **Efficient indexing**: Smaller tables with focused indexes

### 3. Data Integrity
- **Foreign key constraints**: Enforce relationships between models and configs
- **Cascade delete**: No orphaned config records
- **Type safety**: Each config has its own TypeScript interface

### 4. Flexibility
- **Independent server config**: Server settings don't depend on models
- **Optional configs**: Not all models need all config types
- **Extensible**: Add new config types without modifying existing tables

### 5. Developer Experience
- **Clear interfaces**: Each config has a dedicated TypeScript interface
- **Predictable API**: Functions are named by config type
- **Easy testing**: Can test config types in isolation

---

## Notes

- Database file: `./data/llama-dashboard.db`
- WAL journal mode enabled for performance
- Auto-vacuum on cleanup keeps size minimal
- **Database version**: 2.0 (normalized schema)
- Cascade delete ensures referential integrity
- Server config is independent (no FK to models)
- All llama-server parameters are available across config tables
- Each model can have only one configuration per config type (1:1 relationship)
- Lazy loading is recommended for performance - load configs only when needed
