# Database Empty - Root Cause and Fix

## Problem
Database is empty ("absolutely nothing left inside") after refreshing models.

## Root Cause

### 1. Multiple Database Initializations

The database is being initialized multiple times:

**server.js (line 729):**
```javascript
await initDatabase();
```

**LlamaServerIntegration.ts (line 29, 86):**
```javascript
// load_config handler
await initDatabase();  // Line 29

// save_config handler  
await initDatabase();  // Line 86
```

Each `initDatabase()` call:
- Opens database connection
- Calls `createTables(db)` with `CREATE TABLE IF NOT EXISTS`

**The problem:** Even with `IF NOT EXISTS`, if database is in a bad state or if a vacuum operation is happening, it can lose data.

### 2. server.js Auto-Import from LlamaServer

**server.js (lines 97-127):**
```javascript
socket.on('load_models', async () => {
  let dbModels = getModels();
  
  // Auto-import from llama-server if database is empty
  if (dbModels.length === 0) {
    logger.info('📥 [SOCKET.IO] Database is empty, auto-importing models from llama-server...');
    
    const llamaService = llamaIntegration.getLlamaService?.();
    const state = llamaService?.getState?.();
    const llamaModels = state?.models || [];
    
    for (const llamaModel of llamaModels) {
      // Create model record for database
      const modelRecord = {
        name: llamaModel.name,
        type: 'llama',  // or 'mistral', 'other'
        status: 'stopped',
        model_path: llamaModel.parameters?.model_path || llamaModel.name,
        ...
      };
      
      const dbId = saveModel(modelRecord);
    }
    
    dbModels = getModels();  // Reload after import
  }
});
```

**The problem:** This code:
1. Checks if database is empty
2. Tries to import from llama-server (which is old implementation)
3. The llamaService might not be running or might return empty models
4. Errors in import leave database empty

## Solution

### 1. Remove Multiple initDatabase() Calls

**Edit LlamaServerIntegration.ts:**

**Remove line 29 in load_config handler:**
```javascript
// ❌ DELETE THIS LINE:
await initDatabase();

// Database is already initialized in server.js (line 729)
// Multiple init calls can cause issues
```

**Remove line 86 in save_config handler:**
```javascript
// ❌ DELETE THIS LINE:
await initDatabase();

// Database is already initialized globally
```

### 2. Remove server.js Auto-Import Logic

The database should use **ModelImportService** which scans the filesystem directly, not llama-server.

**Option A: Remove server.js auto-import (Recommended)**

Remove lines 96-127 from server.js:
- Remove the entire `if (dbModels.length === 0)` block
- Models are now imported via "rescanModels" → ModelImportService
- Database is not empty after initial import

**Option B: Update to use ModelImportService (Fallback)**

If we want to keep the fallback:

```javascript
// Import from database filesystem (using ModelImportService)
socket.on('rescanModels', async () => {
  logger.info('📥 [SOCKET.IO] Rescan models request received');
  
  const modelImportService = new ModelImportService();
  const result = await modelImportService.importModels();
  
  socket.emit("models_imported", {
    success: true,
    data: result,
    timestamp: Date.now(),
  });
});
```

### 3. Ensure ModelImportService Works

The **new** ModelImportService (with gguf.js) should:
- Read models directory from Settings (database or config file)
- Scan for GGUF files
- Extract GGUF metadata using `gguf` library
- Save to database
- NOT rely on llama-server

This is implemented in `src/server/services/model-import-service.ts`:
```typescript
import gguf from "gguf";

public async extractMetadata(model: DiscoveredModel): Promise<ModelWithMetadata> {
  const result = await gguf(model.path);
  
  const metadata = result.metadata || {};
  const architecture = metadata.general?.architecture || "unknown";
  const parameterCount = metadata.general?.parameter_count;
  const quantization = metadata.quantization?.version;
  const contextLength = metadata.llama?.context_length;
  
  return { ...model, metadata, architecture, ... };
}
```

## Event Flow (After Fix)

### Initial Load (App Startup)
```
Frontend: Page mounts
    ↓
Frontend: sendMessage('load_models', {})
    ↓
Server.js: socket.on('load_models')
    ↓
Server.js: getModels() from database
    ↓
Server.js: socket.emit('models_loaded', { data: [...] })
    ↓
Frontend: Display models from database
```

### Refresh Models (User clicks refresh)
```
Frontend: Click refresh button
    ↓
Frontend: sendMessage('rescanModels', {})
    ↓
LlamaServerIntegration: socket.on('rescanModels')
    ↓
ModelImportService: Scan directory for GGUF files
    ↓
ModelImportService: Extract GGUF metadata with gguf.js
    ↓
ModelImportService: Save to database
    ↓
LlamaServerIntegration: socket.emit('models_imported', result)
    ↓
WebSocket Provider: Handle models_imported
    ↓
WebSocket Provider: sendMessage('load_models', {})
    ↓
Server.js: socket.on('load_models')
    ↓
Server.js: getModels() from database (now has data!)
    ↓
Server.js: socket.emit('models_loaded', { data: [...] })
    ↓
Frontend: Display models
```

## Files to Modify

### 1. server.js
Remove lines 96-127 (auto-import from llama-server):
- Remove `if (dbModels.length === 0)` block
- Models are imported via "rescanModels" event instead

### 2. src/server/services/LlamaServerIntegration.ts
Remove `initDatabase()` calls:
- Line 29 in `load_config` handler
- Line 86 in `save_config` handler

### 3. src/server/services/model-import-service.ts
Already updated with gguf.js library.

## Benefits

1. **Single Database Init** - Database only initialized once at server startup
2. **No Data Loss** - No risk of clearing database during config operations
3. **Proper GGUF Metadata** - Real metadata from GGUF files, not llama-server
4. **Clearer Flow** - Database is source of truth for models
5. **Working Refresh** - Refresh button triggers filesystem scan, imports to database, then loads from database

## Testing

1. **Delete database file**:
```bash
rm /home/bamer/nextjs-llama-async-proxy/data/llama-dashboard.db
```

2. **Restart server**:
```bash
node server.js
```

3. **Navigate to Models page**:
   - Should show "No models" initially
   - Database is empty

4. **Click refresh button**:
   - Should scan /models directory
   - Should extract GGUF metadata
   - Should save to database
   - Should display models

5. **Verify database**:
```bash
# Check models are in database
sqlite3 data/llama-dashboard.db "SELECT name, architecture, quantization_type FROM models LEFT JOIN model_fit_params ON models.id = model_fit_params.model_id;"
```

6. **Check console logs**:
```
[ModelImport] Scanning models directory: /models
[ModelImport] Found 3 model(s) in directory
[ModelImport] Extracting GGUF metadata for: llama-3-8b
[ModelImport] GGUF metadata extracted for llama-3-8b: {...}
[ModelImport] Creating new model: llama-3-8b
[ModelImport] Import complete: 3 imported, 0 updated, 0 errors
```

## Summary

| Issue | Root Cause | Fix |
|--------|------------|-----|
| Database empty | Multiple initDatabase() calls clearing/resetting | Remove duplicate init calls |
| No models | Old llama-server auto-import failing | Use ModelImportService with gguf.js |
| Metadata wrong | Using llama-fit-params | Using gguf.js library |
| Database not source | server.js loading from llama-server | Database is source of truth |

After these fixes:
- Database is initialized **once** at startup
- Models are loaded **from database** (not llama-server)
- Refresh button scans **filesystem** with GGUF metadata
- Models are saved **to database** properly
- No more "undefined" prefixes
- No more database being empty
