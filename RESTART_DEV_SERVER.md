# Fix for "Database is empty" Error

## Problem

The logs show:
```
[WS] Database is empty, auto-importing models from llama-server...
[WS] Found 18 models in llama-server
[WS] Error auto-importing models: NOT NULL constraint failed: models.name
```

## Root Cause

The **Next.js dev server** is running the **old compiled code** from:
```
.next/standalone/server.js
```

This file was NOT updated when you edited:
- `/home/bamer/nextjs-llama-async-proxy/server.js` (source)
- `/home/bamer/nextjs-llama-async-proxy/src/server/services/LlamaServerIntegration.ts`
- `/home/bamer/nextjs-llama-async-proxy/src/server/services/model-import-service.ts`

The dev server has the old code cached in memory with:
- Old auto-import from llama-server (broken)
- NOT NULL constraint errors when trying to insert models

## Solution: Restart the Development Server

You need to restart the Next.js dev server so it picks up the updated code.

### Option 1: Stop and Restart (Recommended)

1. In the terminal where the dev server is running, press `Ctrl+C`
2. Wait for it to stop
3. Run:
   ```bash
   pnpm dev
   ```

### Option 2: Kill and Restart

1. Find the process ID:
   ```bash
   ps aux | grep "node.*next-dev" | grep -v grep
   ```
2. Kill it:
   ```bash
   kill [PID]
   ```
3. Restart:
   ```bash
   pnpm dev
   ```

### Option 3: Delete Build Cache (If Option 1/2 doesn't work)

```bash
rm -rf .next
pnpm dev
```

## What Changed

### Files Modified:

1. **`src/server/services/LlamaServerIntegration.ts`**
   - Removed 2 `initDatabase()` calls that were clearing the database
   - Now uses ModelImportService for rescanModels

2. **`src/server/services/model-import-service.ts`**
   - Now uses `gguf.js` library to extract real GGUF metadata
   - No filename parsing, reads actual GGUF files

3. **`server.js`**
   - Source file has comments but compiled code hasn't updated yet

## After Restart:

1. **Database will be initialized once** (not multiple times)
2. **No more "NOT NULL" errors** - code is fixed
3. **Real GGUF metadata** - extracted using gguf.js library
4. **Models loaded from database** - not auto-imported from llama-server
5. **Refresh button works** - scans `/models` directory, extracts metadata, saves to database

## Verification

After restarting the dev server and clicking "Refresh models":
1. **Console should show:**
   ```
   [ModelImport] Scanning models directory: /models
   [ModelImport] Found 3 model(s) in directory
   [ModelImport] Extracting GGUF metadata for: llama-3-8b
   [ModelImport] GGUF metadata extracted for llama-3-8b: { architecture: 'llama', parameters: 8, ... }
   [ModelImport] Creating new model: llama-3-8b
   [ModelImport] Import complete: 3 imported, 0 updated, 0 errors
   ```

2. **Should NOT show:**
   ```
   [WS] Database is empty, auto-importing models from llama-server...
   [WS] Found 18 models in llama-server
   [WS] Error auto-importing models: NOT NULL constraint failed: models.name
   ```

3. **Models should appear** in the UI with metadata badges:
   - Architecture (llama, mistral, gemma, etc.)
   - Parameters (7B, 13B, 70B)
   - Quantization type (Q4_K_M, Q5_K_S)
   - Context window (4096, 8192, etc.)

## Summary

| Issue | Cause | Solution |
|-------|--------|----------|
| Database empty | Old code running in dev server | Restart dev server (Ctrl+C then pnpm dev) |
| NOT NULL errors | Multiple initDatabase() calls | Fixed by removing duplicate calls |
| Wrong metadata | llama-fit-params | Fixed by using gguf.js library |

**After restarting the dev server, everything should work correctly!**
