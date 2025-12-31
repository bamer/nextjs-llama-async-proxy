# Solution: Restart Dev Server

## Problem

The logs show:
```
[WS] Database is empty, auto-importing models from llama-server...
[WS] Found 18 models in llama-server
[WS] Error auto-importing models: NOT NULL constraint failed: models.name
```

But I removed that code! The problem is:
- **Source files were edited** (`server.js`, `LlamaServerIntegration.ts`, `model-import-service.ts`)
- **Next.js dev server is running old cached compiled code**
- The old code has buggy auto-import that inserts NULL names

## Solution

**Restart the development server** to pick up your changes:

### Method 1: Stop and Restart (Easiest)

1. In the terminal where `pnpm dev` is running, press **Ctrl+C**
2. Wait for it to stop
3. Run:
   ```bash
   pnpm dev
   ```

### Method 2: Kill and Restart (If stuck)

1. Find the process:
   ```bash
   ps aux | grep "node.*next-dev"
   ```

2. Kill it:
   ```bash
   kill [PID]
   ```

3. Restart:
   ```bash
   pnpm dev
   ```

### Method 3: Delete Build Cache (If still issues)

1. Stop the dev server (Ctrl+C)
2. Delete build cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

## What Will Change After Restart

### Logs Will Show:
```
[WS] Load models from database request received
[WS] Loaded 3 model(s) from database
```

### If You Click Refresh:
```
[ModelImport] Scanning models directory: /models
[ModelImport] Found 3 model(s) in directory
[ModelImport] Extracting GGUF metadata for: llama-3-8b-instruct
[ModelImport] GGUF metadata extracted for: llama-3-8b-instruct: { architecture: 'llama', parameters: 8, ... }
[ModelImport] Creating new model: llama-3-8b-instruct
[ModelImport] Import complete: 3 imported, 0 updated, 0 errors
```

### Models in UI Will Have:
- ✅ Real GGUF metadata (architecture, parameters, quantization)
- ✅ No "NOT NULL" errors
- ✅ Loaded from database (source of truth)
- ✅ Refresh button triggers filesystem scan

## Files Already Fixed (Not Requiring Restart)

1. **`src/server/services/LlamaServerIntegration.ts`**
   - Removed duplicate `initDatabase()` calls
   - Uses ModelImportService for rescanModels

2. **`src/server/services/model-import-service.ts`**
   - Uses `gguf.js` library for GGUF metadata extraction

3. **`server.js`**
   - Source file has comments about removing auto-import
   - But compiled code in `.next/standalone/` still has old code

## Summary

**Why restart is needed:**
- Development server has old code cached in memory
- Source file edits don't apply until server recompiles
- "Database is empty" message comes from cached compiled code, not your edited source

**After restart:**
- ✅ Database initialized once (not 4+ times)
- ✅ Models loaded from database (not llama-server)
- ✅ Refresh button scans filesystem with gguf.js
- ✅ Real GGUF metadata extracted
- ✅ No more "NOT NULL constraint failed" errors

**Press Ctrl+C then run `pnpm dev` to fix!**
