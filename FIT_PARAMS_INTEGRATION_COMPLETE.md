# Fit-Params Integration - Complete Implementation Summary

## Overview

This document summarizes the complete integration of `llama-fit-params` automatic model analysis for the Next.js 16 Llama Dashboard application. The implementation enables automatic analysis of models to determine optimal runtime parameters and extract metadata.

## What Was Implemented

### 1. Fit-Params Service (`src/server/services/fit-params-service.ts`)

**Location:** `/home/bamer/nextjs-llama-async-proxy/src/server/services/fit-params-service.ts`

**Features:**
- Executes `llama-fit-params -m <model_path> -fit on -fit-target 1024 -fit-ctx 4096`
- Parses output to extract:
  - Recommended context size (`-c N`)
  - Recommended GPU layers (`-ngl N`)
  - Tensor split (`-ts N,N,N`)
  - Projected CPU/GPU memory usage
- Extracts model metadata from filename:
  - Quantization type (Q4_K_M, Q5_K_S, etc.)
  - Parameter count (7B, 13B, etc.)
  - Architecture (Llama, Gemma, Mistral, etc.)
  - Context window (if present in filename)
- Batch analysis support for multiple models
- 60-second timeout for safety
- Error handling with graceful degradation

**Key Functions:**
- `analyzeModel(modelPath: string): Promise<FitParamsResult>` - Analyze a single model
- `analyzeModels(modelPaths: string[]): Promise<Map<string, FitParamsResult>>` - Batch analysis
- `parseModelFilename(filename: string): ModelMetadata` - Extract metadata from filename
- `parseFitParamsOutput(output: string): FitParamsResult` - Parse llama-fit-params output
- `shouldAnalyze(lastAnalyzedAt, modelPath): boolean` - Check if re-analysis needed

### 2. Database Schema Updates (`src/lib/database.ts`)

**New Table: `model_fit_params`**
```sql
CREATE TABLE IF NOT EXISTS model_fit_params (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL UNIQUE,

  -- Fit-params results
  recommended_ctx_size INTEGER,
  recommended_gpu_layers INTEGER,
  recommended_tensor_split TEXT,

  -- Model metadata
  file_size_bytes INTEGER,
  quantization_type TEXT,
  parameter_count INTEGER,
  architecture TEXT,
  context_window INTEGER,

  -- Analysis metadata
  fit_params_analyzed_at INTEGER,
  fit_params_success INTEGER DEFAULT 0,
  fit_params_error TEXT,
  fit_params_raw_output TEXT,

  -- Memory projections
  projected_cpu_memory_mb REAL,
  projected_gpu_memory_mb REAL,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);
```

**Updated Table: `models`**
Added columns:
- `file_size_bytes INTEGER` - Model file size
- `fit_params_available INTEGER DEFAULT 0` - Flag if fit-params analysis exists
- `last_fit_params_check INTEGER` - Timestamp of last fit-params check

**TypeScript Interface:**
```typescript
export interface ModelFitParams {
  id?: number;
  model_id?: number;
  recommended_ctx_size?: number | null;
  recommended_gpu_layers?: number | null;
  recommended_tensor_split?: string | null;
  file_size_bytes?: number | null;
  quantization_type?: string | null;
  parameter_count?: number | null;
  architecture?: string | null;
  context_window?: number | null;
  fit_params_analyzed_at?: number | null;
  fit_params_success?: number | null;
  fit_params_error?: string | null;
  fit_params_raw_output?: string | null;
  projected_cpu_memory_mb?: number | null;
  projected_gpu_memory_mb?: number | null;
  created_at?: number;
  updated_at?: number;
}
```

**Database Functions:**
- `saveModelFitParams(modelId, fitParams): number` - Save or update fit-params data
- `getModelFitParams(modelId): ModelFitParams | null` - Retrieve fit-params data
- `shouldReanalyzeFitParams(modelId, modelPath): boolean` - Check if re-analysis needed

### 3. API Endpoints (`app/api/models/[id]/analyze/route.ts`)

**Location:** `/home/bamer/nextjs-llama-async-proxy/app/api/models/[id]/analyze/route.ts`

**GET `/api/models/:id/analyze`**
- Fetch existing fit-params data for a model
- Returns model info and fit-params data
- Status codes:
  - 200: Success
  - 400: Invalid model ID
  - 404: Model not found
  - 500: Server error

**POST `/api/models/:id/analyze`**
- Trigger new fit-params analysis on a model
- Runs `llama-fit-params` binary
- Saves results to database
- Returns analysis results
- Status codes:
  - 200: Success
  - 400: Invalid model ID or no model path
  - 404: Model not found
  - 500: Analysis error

### 4. React Hook (`src/hooks/use-fit-params.ts`)

**Location:** `/home/bamer/nextjs-llama-async-proxy/src/hooks/use-fit-params.ts`

**Features:**
- Fetch fit-params data for a model
- Trigger new analysis
- Loading and error states
- Auto-refresh on model ID change

**Hook API:**
```typescript
const { data, loading, error, analyze, refresh } = useFitParams(modelId: number | null);

// data: FitParamsData | null - Analysis results
// loading: boolean - Loading state
// error: string | null - Error message
// analyze(): Promise<void> - Trigger new analysis
// refresh(): Promise<void> - Refresh from database
```

### 5. Frontend Integration (`app/models/page.tsx`)

**Location:** `/home/bamer/nextjs-llama-async-proxy/app/models/page.tsx`

**Added UI Elements:**
1. **Analyze Button** - Science icon button next to each model
   - Triggers fit-params analysis
   - Shows loading spinner while analyzing

2. **Model Metadata Chips** - Display fit-params data
   - "Fit-Params Analyzed" badge (green with checkmark)
   - File size chip (with storage icon)
   - Quantization type chip (e.g., "Q4_K_M")
   - Parameter count chip (e.g., "7B")

3. **Fit-Params State Management**
   - Tracks which model is being analyzed
   - Stores current fit-params data
   - Handles analysis dialog

**Helper Functions:**
```typescript
function formatFileSize(bytes: number | undefined | null): string
// Formats bytes to human-readable format (KB, MB, GB, TB)
```

### 6. Environment Configuration

**Required Environment Variables (add to `.env`):**
```bash
# Path to llama-fit-params binary
FIT_PARAMS_BINARY=/home/bamer/llama.cpp/build/bin/llama-fit-params

# Target sequence length for fit-params analysis
FIT_TARGET=1024

# Context window size for fit-params analysis
FIT_CTX=4096
```

**Defaults (if not specified):**
- `FIT_PARAMS_BINARY`: `/home/bamer/llama.cpp/build/bin/llama-fit-params`
- `FIT_TARGET`: `1024`
- `FIT_CTX`: `4096`

## How It Works

### Model Analysis Flow

1. **User clicks Analyze button** on a model card
2. **Frontend calls** `useFitParams.analyze()`
3. **POST request** to `/api/models/:id/analyze`
4. **Backend**:
   - Validates model exists and has a path
   - Runs `llama-fit-params` binary
   - Parses output for recommendations
   - Extracts metadata from filename
   - Saves results to `model_fit_params` table
5. **Frontend updates** with analysis results
6. **UI displays** metadata chips and recommendations

### Automatic Integration Points

#### Option A: Integrate in Model Import (Recommended)

When models are scanned/imported:

```typescript
// In LlamaServerIntegration.ts or server.js
socket.on("models_imported", async (data: { models: LlamaModel[] }) => {
  for (const model of data.models) {
    // Save model to database
    const modelId = saveModel(modelConfig);

    // Trigger fit-params analysis in background
    if (model.path) {
      analyzeModel(model.path).then(result => {
        saveModelFitParams(modelId, result);
      });
    }
  }
});
```

**Benefits:**
- Automatic analysis on import
- Non-blocking (runs in background)
- Fresh data for all models

#### Option B: Scheduled/Cron Job

Periodically check for models without fit-params:

```typescript
// Background task to run every hour
setInterval(async () => {
  const models = getModels();
  for (const model of models) {
    if (shouldReanalyzeFitParams(model.id, model.model_path)) {
      analyzeModel(model.model_path).then(result => {
        saveModelFitParams(model.id, result);
      });
    }
  }
}, 60 * 60 * 1000); // Every hour
```

**Benefits:**
- Catches new models
- Re-analyzes modified models
- Can run on schedule

## Using Fit-Params Recommendations

### In ModelConfigDialog

When opening configuration dialog:

```typescript
// Check if fit-params available
const fitParams = getModelFitParams(modelId);

// Initialize form with fit-params recommendations
if (fitParams?.fit_params_success) {
  initialConfig = {
    ctx_size: fitParams.recommended_ctx_size || 4096,
    gpu_layers: fitParams.recommended_gpu_layers || -1,
    tensor_split: fitParams.recommended_tensor_split || undefined,
    // Show "Recommended by fit-params" indicator
  };
}
```

### Model Card Display

```typescript
// Display metadata chips
<Box>
  <Chip icon={<Check />} label="Fit-Params Analyzed" />
  <Chip icon={<Storage />} label={formatFileSize(fileSize)} />
  <Chip label={quantizationType} />
  <Chip label={`${paramCount}B`} />
</Box>
```

## Error Handling

### Service Level
- Binary not found → Returns error with null recommendations
- Model file not found → Returns error with null recommendations
- Timeout (60s) → Returns error, extracts metadata from filename
- Invalid output → Returns error, extracts metadata from filename

### API Level
- Invalid model ID → 400 Bad Request
- Model not found → 404 Not Found
- No model path → 400 Bad Request
- Analysis failed → 500 Internal Server Error

### Frontend Level
- Loading state during analysis
- Error message on failure
- Graceful degradation (show available metadata)

## Performance Considerations

### Optimization
- 60-second timeout prevents hanging
- Batch analysis for multiple models
- Background processing doesn't block UI
- Results cached in database

### Scalability
- SQLite handles thousands of fit-params records
- Analysis runs on-demand or on schedule
- No impact on model loading performance

## Testing

### Unit Tests (Recommended)

```typescript
// fit-params-service.test.ts
describe('parseModelFilename', () => {
  it('extracts quantization type', () => {
    const result = parseModelFilename('llama-7b-q4_k_m.gguf');
    expect(result.quantization_type).toBe('Q4_K_M');
  });

  it('extracts parameter count', () => {
    const result = parseModelFilename('llama-7b-q4_k_m.gguf');
    expect(result.parameter_count).toBe(7);
  });
});

describe('parseFitParamsOutput', () => {
  it('extracts recommended ctx size', () => {
    const output = "Recommended: -c 4096 -ngl 35";
    const result = parseFitParamsOutput(output);
    expect(result.recommended_ctx_size).toBe(4096);
  });
});
```

### Integration Tests

```typescript
// api/models/[id]/analyze.test.ts
describe('POST /api/models/:id/analyze', () => {
  it('runs fit-params analysis', async () => {
    const response = await fetch(`/api/models/1/analyze`, {
      method: 'POST',
    });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.fitParams).toBeDefined();
  });
});
```

## Future Enhancements

1. **Background Analysis Service** - Run analysis for all models on startup
2. **WebSocket Events** - Broadcast fit-params completion to all connected clients
3. **Auto-Apply Recommendations** - Option to automatically apply fit-params recommendations
4. **Memory Threshold Warnings** - Alert if model exceeds available GPU memory
5. **Comparison View** - Compare fit-params vs. current configuration
6. **Export Analysis** - Export fit-params data as JSON/CSV
7. **Analysis History** - Track analysis results over time

## Troubleshooting

### Binary Not Found
```
Error: Fit-params binary not found: /home/bamer/llama.cpp/build/bin/llama-fit-params
```
**Solution:** Build llama.cpp with fit-params tool:
```bash
cd /home/bamer/llama.cpp
cmake -B build -DLLAMA_FIT_PARAMS=ON
cmake --build build --target llama-fit-params
```

### Timeout
```
Error: Analysis timed out after 60000ms
```
**Solution:** Large models (>70B) may take longer. Increase timeout or analyze in chunks.

### No GPU Recommendations
```
recommended_gpu_layers: null
```
**Solution:** Check if CUDA/ROCm is available. Fit-params needs GPU detection.

## Summary

This integration provides:
- ✅ Automatic model analysis with llama-fit-params
- ✅ Metadata extraction from filenames
- ✅ Database persistence of analysis results
- ✅ RESTful API for triggering/retrieving analysis
- ✅ React hook for easy frontend integration
- ✅ UI components for displaying analysis data
- ✅ Error handling and graceful degradation
- ✅ Scalable architecture for future enhancements

All components follow the existing codebase patterns and integrate seamlessly with the current architecture.
