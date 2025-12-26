# LLama-Server Model Discovery - Complete Fix

## Issue Summary
After starting llama-server, the Models page showed only "Loading models..." instead of displaying available models.

## Root Cause
Code was querying wrong endpoint:
- **Wrong**: `/api/models` (returned 404 Not Found)
- **Correct**: `/models` (OpenAI-compatible endpoint)

## Solution Implemented

### 1. Backend Endpoint Fix (LlamaService.ts)
```typescript
// BEFORE: GET /api/models (404 error)
const response = await this.client.get("/api/models");

// AFTER: GET /models (correct OpenAI-compatible endpoint)
const response = await this.client.get("/models");
```

**Response Format**:
```json
{
  "data": [
    {
      "id": "model-name",
      "object": "model",
      "owned_by": "llamacpp",
      "created": 1766730334,
      "status": {"value": "unloaded", ...}
    },
    ...
  ],
  "object": "list"
}
```

### 2. Frontend Real-Time Updates (ModelsPage.tsx)
Added WebSocket listener to receive real-time model updates:
- Connects to WebSocket on component mount
- Listens for `models` event broadcasts
- Updates UI immediately when models are discovered

### 3. Fallback Mechanism
If `/models` endpoint fails:
1. Attempts to scan filesystem (`basePath`)
2. Looks for `.gguf` and `.bin` files
3. Creates model objects from file info

## Test Results

✅ **llama-server endpoint test**:
```bash
$ curl http://localhost:8134/models | jq '.data | length'
12
```

✅ **Models discovered**:
- Devstral-Small-2-24B-Instruct-2512-UD-Q4_K_XL
- Huihui-Devstral-Small-2-24B-Instruct-2512-abliterated-Q4_K_S
- Huihui-Devstral-Small-2-24B-Instruct-2512-abliterated-Q5_K_S
- Ministral-3-8B-Instruct-2512-Q6_K
- NVIDIA-Nemotron-3-Nano-30B-A3B-MXFP4_MOE
- Qwen3-30B-A3B-Instruct-2507-iq4_nl-EHQKOUD-IQ4NL
- Trinity-Mini.i1-Q4_K_M
- codegemma-1.1-7b-it.i1-Q5_K_S
- gemma-3-12b-it-UD-Q4_K_XL
- gpt-oss-20b-Q4_K_M-uwufied-v2
- mmproj-F16
- open-thoughts_OpenThinker-Agent-v1-Q5_K_L

## Complete Workflow

```
User starts app
  ↓
LlamaService initializes
  ↓
Queries: GET /models from llama-server
  ↓
Parses response.data array
  ↓
Updates internal state.models
  ↓
Calls emitStateChange()
  ↓
server.js onStateChange listener triggers
  ↓
Broadcasts to all connected clients: io.emit('models', ...)
  ↓
Frontend WebSocket listener receives 'models' event
  ↓
ModelsPage.tsx updates state
  ↓
UI displays all available models ✅
```

## Files Modified

1. **src/server/services/LlamaService.ts** (3 key changes)
   - Fixed endpoint: `/api/models` → `/models`
   - Added parsing for response.data.data structure
   - Added filesystem fallback

2. **src/components/pages/ModelsPage.tsx** (2 key changes)
   - Added WebSocket connection
   - Added listener for real-time model updates

3. **server.js** (1 key change)
   - Broadcast models immediately on state change

## Notes

- llama-server is **OpenAI API compatible**
- The `/models` endpoint auto-discovers from `--models-dir`
- Response includes detailed model info (id, status, args, presets)
- Works with both single-model and router-mode configurations
