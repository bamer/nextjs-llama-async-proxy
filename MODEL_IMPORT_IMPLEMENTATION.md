# File-Based Model Import Implementation Summary

## Overview
This implementation re-enables file-based model import with GGUF metadata extraction and database persistence. The system now properly reads models from the configured directory (from Settings page), extracts metadata using llama-fit-params, and stores everything in the production database.

## Key Components

### 1. ModelImportService (`src/server/services/model-import-service.ts`)
A new service that handles the complete model import workflow:

**Key Features:**
- Reads models directory from Settings (database `models_dir` or JSON config `basePath`)
- Scans filesystem for `.gguf` and `.bin` files
- Extracts metadata using `llama-fit-params` tool
- Saves/updates models in production database
- Preserves existing model configurations when updating

**Main Methods:**
- `getModelsDirectory()` - Returns configured models directory path
- `scanModelsDirectory()` - Discovers all model files in directory
- `extractMetadata()` - Runs llama-fit-params analysis on each model
- `saveModelToDatabase()` - Creates or updates model in database with metadata
- `importModels()` - Orchestrates full import workflow

### 2. API Route (`app/api/models/import/route.ts`)
New REST API endpoint for model import:

**Endpoints:**
- `GET /api/models/import` - Get current models directory
- `POST /api/models/import` - Trigger full model import

**Response Format:**
```json
{
  "success": true,
  "data": {
    "message": "Import complete: 2 new, 1 updated",
    "imported": 2,
    "updated": 1,
    "errors": 0
  },
  "timestamp": 1735608000000
}
```

### 3. WebSocket Integration (`src/server/services/LlamaServerIntegration.ts`)
Updated WebSocket handlers to support database-first model loading:

**WebSocket Events:**
- `rescanModels` - Scans filesystem and imports models to database
- `load_models` - Loads models from database (not llama-server)

**Key Changes:**
- `rescanModels` now uses `ModelImportService` instead of restarting llama-server
- Added `load_models` handler to fetch from database
- Models are broadcast from database, not from llama-server's in-memory list

## Database Schema Integration

### Models Table
Updated with GGUF metadata:
```sql
models (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  model_path TEXT,              -- Full path to .gguf/.bin file
  file_size_bytes INTEGER,         -- Model file size
  ctx_size INTEGER,               -- Recommended context size from fit-params
  fit_params_available INTEGER,     -- Flag: 1 if metadata extracted
  last_fit_params_check INTEGER,   -- Timestamp of last analysis
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

### Model Fit Params Table
Stores detailed GGUF metadata:
```sql
model_fit_params (
  id INTEGER PRIMARY KEY,
  model_id INTEGER NOT NULL UNIQUE,
  recommended_ctx_size INTEGER,
  recommended_gpu_layers INTEGER,
  file_size_bytes INTEGER,
  quantization_type TEXT,          -- Q4_K_M, Q5_K_S, etc.
  parameter_count INTEGER,          -- 7B, 13B, 70B, etc.
  architecture TEXT,               -- llama, mistral, gemma, etc.
  context_window INTEGER,           -- 8k, 16k, etc.
  fit_params_analyzed_at INTEGER,
  fit_params_success INTEGER,
  fit_params_error TEXT,
  fit_params_raw_output TEXT,
  projected_cpu_memory_mb REAL,
  projected_gpu_memory_mb REAL,
  FOREIGN KEY (model_id) REFERENCES models(id)
)
```

## Workflow

### Initial Load (on app startup)
1. Frontend sends `load_models` WebSocket message
2. Server reads models from database (not filesystem)
3. Models are broadcast to all connected clients
4. UI displays models from database

### Refresh Models (user clicks refresh button)
1. Frontend sends `rescanModels` WebSocket message
2. `ModelImportService` reads configured directory from Settings
3. Service scans filesystem for `.gguf` and `.bin` files
4. For each discovered model:
   - Runs `llama-fit-params` to extract metadata
   - Parses quantization type (Q4_K_M, Q5_K_S, etc.)
   - Parses parameter count (7B, 13B, etc.)
   - Parses architecture (llama, mistral, gemma, etc.)
   - Parses context window (8k, 16k, etc.)
5. Creates new model entry or updates existing one in database
6. Broadcasts updated models list to all clients
7. UI shows progress message with counts

### Settings Page Integration
- Models directory is configured in Settings > General Settings > Base Path
- Can be updated by admin via UI
- Saved to `model_server_config` table (`models_dir` field)
- Falls back to JSON config `llama-server-config.json` if database empty

## Metadata Extraction

### Using llama-fit-params
The system uses `/home/bamer/llama.cpp/build/bin/llama-fit-params` tool:

**Command:**
```bash
llama-fit-params -m /models/model.gguf -fit on -fit-target 1024 -fit-ctx 4096
```

**Parsed Information:**
- Recommended context size (`-c`)
- Recommended GPU layers (`-ngl`)
- Tensor split configuration (`-ts`)
- Projected CPU/GPU memory usage
- Quantization type from filename (Q4_K_M, etc.)
- Parameter count from filename (7B, 13B, etc.)
- Architecture from filename (llama, mistral, etc.)

### Fallback Metadata Parsing
If llama-fit-params fails, metadata is extracted from filename:

```javascript
// Examples:
"Mistral-7B-Instruct-v0.2.Q4_K_M.gguf"
  -> quantization: "Q4_K_M"
  -> parameters: 7
  -> architecture: "mistral"

"Llama-3-8B-Instruct.Q5_K_S-8k.gguf"
  -> quantization: "Q5_K_S"
  -> parameters: 8
  -> architecture: "llama"
  -> context_window: 8192
```

## UI Components

### Models Page (`app/models/page.tsx`)
- Displays models loaded from database
- Shows model metadata badges:
  - Fit-Params Analyzed (if metadata available)
  - File size (e.g., "4.2 GB")
  - Quantization type (e.g., "Q4_K_M")
  - Parameter count (e.g., "7B")
- Refresh button triggers `rescanModels` WebSocket event
- Start/Stop buttons for each model

### Settings Page (`app/settings/page.tsx`)
- ModernConfiguration component
- General Settings tab has "Base Path" field
- Saved to `model_server_config` table
- Used by ModelImportService for scanning

## Configuration

### Environment Variables
```bash
FIT_PARAMS_BINARY=/home/bamer/llama.cpp/build/bin/llama-fit-params
FIT_TARGET=1024
FIT_CTX=4096
```

### Database Location
```
data/llama-dashboard.db
```

### Settings Files
```
llama-server-config.json  # JSON fallback for models directory
app-config.json          # App-level settings
```

## Testing

### Manual Testing Steps

1. **Configure Models Directory:**
   - Go to Settings page
   - Set "Base Path" to your models directory (e.g., `/models` or `/home/user/models`)
   - Click Save

2. **Initial Load:**
   - Navigate to Models page
   - Models should load from database

3. **Import Models:**
   - Click Refresh button
   - Check logs for import progress
   - Verify models appear with metadata badges

4. **Verify Metadata:**
   - Check database: `sqlite3 data/llama-dashboard.db "SELECT * FROM model_fit_params"`
   - Look at models page badges (quantization, parameters, file size)

5. **Update Existing:**
   - Add a new model to the directory
   - Click Refresh
   - Should import new model, not duplicate existing ones

## Logging

All operations log to Winston logger:

```
[ModelImport] Models directory from database: /models
[ModelImport] Scanning models directory: /models
[ModelImport] Found 3 model(s) in directory
[ModelImport] Extracting metadata for: llama-3-8b
[ModelImport] Metadata extracted for llama-3-8b: { quantization: 'Q4_K_M', parameters: 8 }
[ModelImport] Creating new model: llama-3-8b
[ModelImport] Import complete: 3 imported, 0 updated, 0 errors
```

## Benefits

1. **Database-First Architecture** - Models stored in database as source of truth
2. **GGUF Metadata Extraction** - Automatic extraction of quantization, parameters, architecture
3. **Settings Integration** - Models directory configurable from admin UI
4. **Smart Updates** - Preserves existing configurations when updating
5. **Graceful Fallback** - Works even if llama-fit-params unavailable
6. **Real-time Updates** - WebSocket broadcasts model changes to all clients

## Files Created/Modified

### Created:
- `src/server/services/model-import-service.ts` - Model import service
- `app/api/models/import/route.ts` - Import API endpoint

### Modified:
- `src/server/services/LlamaServerIntegration.ts` - WebSocket handlers
- `app/models/page.tsx` - Fixed ConfigType usage
- `src/components/configuration/hooks/useConfigurationForm.ts` - No changes (already supports basePath)

## Next Steps (Optional Enhancements)

1. **Background Refresh** - Auto-refresh models on interval
2. **Delete from Disk** - Add option to delete model file from disk
3. **Progress Bar** - Show import progress for large model collections
4. **Duplicate Detection** - Warn about duplicate models
5. **Manual Override** - Allow manual metadata editing
6. **Batch Import** - Support importing from multiple directories
7. **Model Groups** - Group models by architecture/family
