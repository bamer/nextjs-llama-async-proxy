# Model Loading & Configuration Options Fix

## Changes Made

### 1. **Fixed Model Loading Issue**

The "Load" button on the Models page was not actually loading models. The issue was:
- Frontend called `/api/models/{name}/start` but no route handler existed
- Model loading was only simulated in the UI without backend integration

**Solution implemented:**
- Created 3 new API routes to handle model loading:
  - `app/api/models/route.ts` - GET endpoint to list available models
  - `app/api/models/[name]/start/route.ts` - POST to load a model
  - `app/api/models/[name]/stop/route.ts` - POST to unload a model

- Exposed `LlamaService` globally in `server.js` so API routes can access it
- API routes forward requests to the actual `llama-server` HTTP API

### 2. **Expanded llama-server Default Configuration Options**

Previously only ~20 basic options were available. Now includes 50+ options from `llama-server --help`:

**New configuration options added:**

**Sampling Parameters:**
- `min_p` - Minimum probability threshold
- `xtc_probability` - XTC sampling probability
- `xtc_threshold` - XTC sampling threshold
- `typical_p` - Typical probability
- `presence_penalty` - Presence penalty for sampling
- `frequency_penalty` - Frequency penalty for sampling
- `dry_multiplier`, `dry_base`, `dry_allowed_length`, `dry_penalty_last_n` - DRY sampling options

**Memory & Architecture:**
- `n_cpu_moe` - CPU layers for MoE models
- `cpu_moe` - Keep MoE layers on CPU
- `tensor_split` - Tensor split specification
- `split_mode` - Split mode for multi-GPU
- `vocab_only` - Load vocabulary only
- `memory_f16`, `memory_f32`, `memory_auto` - Memory type options

**RoPE Scaling:**
- `rope_freq_base` - RoPE frequency base
- `rope_freq_scale` - RoPE frequency scale
- `yarn_ext_factor`, `yarn_attn_factor`, `yarn_beta_fast`, `yarn_beta_slow` - YaRN scaling

**Advanced Options:**
- `penalize_nl` - Penalize newlines
- `ignore_eos` - Ignore end-of-sequence token
- `mlock` - Memory locking
- `numa` - NUMA support
- `memory_mapped` - Memory-mapped I/O
- `use_mmap` - Use mmap
- `grp_attn_n`, `grp_attn_w` - Group attention parameters
- `neg_prompt_multiplier` - Negative prompt multiplier
- `no_kv_offload` - Disable KV cache offloading
- `ml_lock` - Model locking

## Files Modified

1. **src/components/pages/ModernConfiguration.tsx**
   - Expanded `defaultLlamaServerConfig` with 50+ new options
   - Organized options by category (sampling, memory, RoPE, etc.)

2. **src/server/services/LlamaService.ts**
   - Updated `buildArgs()` method to handle new configuration options
   - Added conditional argument building for all new options

3. **server.js**
   - Exposed `llamaService` to global scope: `global.llamaService = llamaService`
   - Added new configuration mappings to pass options to LlamaService

4. **.llama-proxy-config.json**
   - Added all new options with sensible defaults

## Files Created

1. **app/api/models/route.ts** - GET /api/models
   ```typescript
   Returns list of available models from llama-server
   ```

2. **app/api/models/[name]/start/route.ts** - POST /api/models/{name}/start
   ```typescript
   Loads a model via llama-server API
   ```

3. **app/api/models/[name]/stop/route.ts** - POST /api/models/{name}/stop
   ```typescript
   Unloads a model via llama-server API
   ```

## How It Works Now

### Model Loading Flow

1. User clicks "Load" button on Models page
2. Frontend calls `POST /api/models/{modelName}/start`
3. API route receives request and forwards to `llama-server` HTTP API
4. Llama-server loads the model
5. Frontend receives success response
6. UI updates to show model as "loaded"

### Configuration

All llama-server options can now be:
1. Set in `.llama-proxy-config.json` (persistent defaults)
2. Modified in the Settings > Llama-Server Settings UI
3. Passed directly to llama-server when it starts via command-line arguments

## Environment Variables

The API routes respect these optional environment variables:
- `LLAMA_SERVER_HOST` (default: `localhost`)
- `LLAMA_SERVER_PORT` (default: `8134`)

## Testing

To test the model loading:

1. Make sure llama-server is running:
   ```bash
   llama-server -m path/to/model.gguf --port 8134
   ```

2. Start the app:
   ```bash
   pnpm dev
   ```

3. Go to Models page and click Load on any model

4. Check the response in the browser console to verify the model loaded

## Backward Compatibility

- All previous configuration options still work as before
- New options are optional with sensible defaults
- No breaking changes to existing functionality

## Next Steps (Optional Enhancements)

1. Add ability to save model-specific configurations
2. Add real-time model load progress tracking
3. Add GPU memory usage monitoring per model
4. Add model unload warnings if other processes depend on it
