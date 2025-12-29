# Fit-Params Integration - Quick Reference Guide

## What Was Implemented

Complete integration of `llama-fit-params` automatic model analysis including:

✅ **Fit-Params Service** (`src/server/services/fit-params-service.ts`)
  - Runs llama-fit-params binary
  - Parses output for recommendations
  - Extracts metadata from filenames
  - Batch analysis support

✅ **Database Schema** (`src/lib/database.ts`)
  - New `model_fit_params` table
  - Added columns to `models` table:
    - `file_size_bytes`
    - `fit_params_available`
    - `last_fit_params_check`

✅ **API Endpoints** (`app/api/models/[id]/analyze/route.ts`)
  - GET `/api/models/:id/analyze` - Fetch analysis
  - POST `/api/models/:id/analyze` - Run analysis

✅ **React Hook** (`src/hooks/use-fit-params.ts`)
  - Fetch and trigger analysis
  - Loading and error states
  - Auto-refresh on model ID change

✅ **Frontend UI** (`app/models/page.tsx`)
  - Analyze button with Science icon
  - Metadata chips display
  - File size, quantization, parameters shown

## Environment Configuration

Add to `.env` file:

```bash
# Path to llama-fit-params binary
FIT_PARAMS_BINARY=/home/bamer/llama.cpp/build/bin/llama-fit-params

# Target sequence length for analysis (default: 1024)
FIT_TARGET=1024

# Context window for analysis (default: 4096)
FIT_CTX=4096
```

## How to Use

### 1. Analyze a Model Manually

1. Go to Models page (`/models`)
2. Find the model you want to analyze
3. Click the Science icon (Analyze) button
4. Wait for analysis to complete (shows loading spinner)
5. See results displayed as chips:
   - 📦 File size
   - Q4_K_M (quantization type)
   - 7B (parameter count)

### 2. Use Fit-Params in Configuration

When you open a model's configuration dialog:

1. Fit-params data is fetched automatically
2. If available, fields can be initialized with recommendations:
   - Context size → `recommended_ctx_size`
   - GPU layers → `recommended_gpu_layers`
   - Tensor split → `recommended_tensor_split`
3. Shows "Recommended by fit-params" indicator

### 3. API Integration

**Fetch existing analysis:**
```bash
curl http://localhost:3000/api/models/1/analyze
```

**Run new analysis:**
```bash
curl -X POST http://localhost:3000/api/models/1/analyze
```

**Response format:**
```json
{
  "success": true,
  "data": {
    "model": { ... },
    "fitParams": {
      "id": 1,
      "model_id": 1,
      "recommended_ctx_size": 4096,
      "recommended_gpu_layers": 35,
      "recommended_tensor_split": "1,0,0",
      "file_size_bytes": 4194304000,
      "quantization_type": "Q4_K_M",
      "parameter_count": 7,
      "architecture": "llama",
      "context_window": null,
      "fit_params_analyzed_at": 1234567890,
      "fit_params_success": 1,
      "fit_params_error": null,
      "projected_cpu_memory_mb": 8192,
      "projected_gpu_memory_mb": 4096
    }
  },
  "timestamp": 1234567890
}
```

## Database Tables

### `model_fit_params`

Stores fit-params analysis results:

| Column | Type | Description |
|---------|------|-------------|
| id | INTEGER | Primary key |
| model_id | INTEGER | Foreign key to models |
| recommended_ctx_size | INTEGER | Recommended context size |
| recommended_gpu_layers | INTEGER | Recommended GPU layers |
| recommended_tensor_split | TEXT | Tensor split string |
| file_size_bytes | INTEGER | Model file size |
| quantization_type | TEXT | Q4_K_M, etc. |
| parameter_count | INTEGER | 7B, 13B, etc. |
| architecture | TEXT | llama, mistral, etc. |
| context_window | INTEGER | From filename |
| fit_params_analyzed_at | INTEGER | Analysis timestamp |
| fit_params_success | INTEGER | 0/1 success flag |
| fit_params_error | TEXT | Error message |
| fit_params_raw_output | TEXT | Full output |
| projected_cpu_memory_mb | REAL | MB usage |
| projected_gpu_memory_mb | REAL | MB usage |

## Service Functions

### `analyzeModel(modelPath: string)`

Run fit-params on a single model:

```typescript
import { analyzeModel } from "@/server/services/fit-params-service";

const result = await analyzeModel("/path/to/model.gguf");

console.log(result.recommended_ctx_size); // 4096
console.log(result.recommended_gpu_layers); // 35
console.log(result.metadata.quantization_type); // "Q4_K_M"
```

### `parseModelFilename(filename: string)`

Extract metadata from filename without running binary:

```typescript
import { parseModelFilename } from "@/server/services/fit-params-service";

const metadata = parseModelFilename("llama-7b-q4_k_m.gguf");

console.log(metadata.parameter_count); // 7
console.log(metadata.quantization_type); // "Q4_K_M"
console.log(metadata.architecture); // "llama"
console.log(metadata.file_size_bytes); // 4194304000
```

## React Hook Usage

```typescript
import { useFitParams } from "@/hooks/use-fit-params";

function ModelComponent({ modelId }: { modelId: number }) {
  const { data, loading, error, analyze, refresh } = useFitParams(modelId);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <div>
      <Button onClick={analyze}>Analyze Model</Button>
      <Button onClick={refresh}>Refresh Analysis</Button>

      {data && (
        <div>
          <p>Recommended Context: {data.recommended_ctx_size}</p>
          <p>GPU Layers: {data.recommended_gpu_layers}</p>
          <p>File Size: {data.file_size_bytes} bytes</p>
        </div>
      )}
    </div>
  );
}
```

## Automatic Integration

To enable automatic analysis on model import, add to `LlamaServerIntegration.ts`:

```typescript
import { analyzeModel } from "./fit-params-service";
import { saveModelFitParams } from "../../lib/database";

socket.on("models_imported", async (data: { models: LlamaModel[] }) => {
  for (const model of data.models) {
    // Save model to database
    const modelId = saveModel(modelConfig);

    // Trigger fit-params analysis in background
    if (model.path) {
      analyzeModel(model.path)
        .then(fitResult => {
          saveModelFitParams(modelId, fitResult);
          console.log(`[Auto] Fit-params complete for ${model.name}`);
        })
        .catch(err => {
          console.error(`[Auto] Fit-params failed for ${model.name}:`, err);
        });
    }
  }
});
```

## Error Handling

### Binary Not Found

**Error:**
```
Fit-params binary not found: /home/bamer/llama.cpp/build/bin/llama-fit-params
```

**Solution:**
```bash
cd /home/bamer/llama.cpp
cmake -B build -DLLAMA_FIT_PARAMS=ON
cmake --build build --target llama-fit-params
```

### Timeout

**Error:**
```
Error: Analysis timed out after 60000ms
```

**Solution:** Large models take longer. Increase timeout in `fit-params-service.ts`:
```typescript
const FIT_TIMEOUT = 120000; // 120 seconds
```

### No GPU Available

**Result:**
```json
{
  "recommended_gpu_layers": null,
  "projected_gpu_memory_mb": null
}
```

**Solution:** Ensure CUDA/ROCm drivers are installed and llama.cpp was built with GPU support.

## Troubleshooting

### Analysis Never Completes

1. Check binary exists:
   ```bash
   ls -l /home/bamer/llama.cpp/build/bin/llama-fit-params
   ```

2. Test binary manually:
   ```bash
   /home/bamer/llama.cpp/build/bin/llama-fit-params -m /path/to/model.gguf -fit on
   ```

3. Check logs for errors:
   ```bash
   tail -f logs/app-*.log | grep -i "fit-params"
   ```

### No Results Shown in UI

1. Open browser DevTools → Console
2. Check for API errors
3. Verify fit-params table has data:
   ```bash
   sqlite3 data/llama-dashboard.db "SELECT * FROM model_fit_params LIMIT 1"
   ```

## Files Created/Modified

### Created:
- `src/server/services/fit-params-service.ts` - Main service
- `src/hooks/use-fit-params.ts` - React hook
- `app/api/models/[id]/analyze/route.ts` - API endpoints

### Modified:
- `src/lib/database.ts` - Added table and functions
- `app/models/page.tsx` - Added UI elements

## Next Steps

### Optional Enhancements:
1. **WebSocket Events** - Broadcast analysis completion to all clients
2. **Auto-Apply** - Button to automatically apply recommendations
3. **Background Service** - Periodic re-analysis of modified models
4. **Memory Thresholds** - Warn if model exceeds available GPU memory
5. **Comparison View** - Side-by-side comparison of current vs. recommended

### Monitoring:
1. Check database size:
   ```bash
   ls -lh data/llama-dashboard.db
   ```

2. Monitor analysis frequency:
   ```bash
   grep -i "fit-params" logs/app-*.log | wc -l
   ```

3. Track analysis performance:
   ```bash
   sqlite3 data/llama-dashboard.db \
     "SELECT AVG(fit_params_analyzed_at - created_at) as avg_time FROM model_fit_params"
   ```
