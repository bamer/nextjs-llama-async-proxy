# Settings UI Update - All llama-server Options Now Available

## What Changed

The Llama-Server Settings page in the Configuration Center now displays **all available llama-server options**, organized by category:

### Settings Categories

1. **Server Binding** (2 options)
   - Host
   - Port

2. **Basic Options** (8 options)
   - Context Size
   - Batch Size
   - Micro Batch Size (ubatch_size)
   - Threads
   - Batch Threads
   - Predictions (n_predict)
   - Seed

3. **GPU Options** (5 options)
   - GPU Layers
   - Main GPU
   - Flash Attention
   - CPU MoE Layers

4. **Sampling Parameters** (11 options)
   - Temperature
   - Top-K
   - Top-P
   - Min-P
   - Repeat Penalty
   - Repeat Last N
   - Presence Penalty
   - Frequency Penalty
   - Typical-P

5. **Advanced Sampling** (4 options)
   - XTC Probability
   - XTC Threshold
   - DRY Multiplier
   - DRY Base

6. **Memory & Cache** (2 options)
   - Cache Type K (f16/f32/q8)
   - Cache Type V (f16/f32/q8)

7. **RoPE Scaling** (2 options)
   - Rope Freq Base
   - Rope Freq Scale

## How to Use

### Access Settings
1. Go to http://localhost:3000/settings
2. Click the "Llama-Server Settings" tab
3. Scroll through all sections to see available options

### Modify Settings
1. Update any field value
2. Click "Save Configuration" at the bottom
3. Settings are persisted to `config.json`
4. Restart llama-server for changes to take effect

### Default Values
All options have sensible defaults. If you don't see a value, it defaults to:
- Numbers: `-1` (auto) or `0`
- Booleans: `false` or `true`
- Strings: empty or recommended value

## Settings Persistence

Settings are saved in:
- Configuration file: `config.json` (via API)
- Backup config: `.llama-proxy-config.json`

## What Gets Applied to llama-server

When llama-server starts, all settings from the configuration are passed as command-line arguments:

Example:
```bash
llama-server \
  --host 127.0.0.1 \
  --port 8134 \
  -c 4096 \
  -b 2048 \
  --ubatch-size 512 \
  -t -1 \
  --threads-batch -1 \
  -ngl -1 \
  --temp 0.8 \
  --top-k 40 \
  --top-p 0.9 \
  --repeat-penalty 1.0 \
  ... and many more
```

## Important Notes

⚠️ **These settings require llama-server to be restarted to take effect**

Most sampling parameters (temperature, top-p, etc.) affect inference behavior for API requests, not the startup process.

## Backend Implementation

- **File**: `src/server/services/LlamaService.ts` - Method `buildArgs()`
- **Config mapping**: `server.js` - Object `llamaServiceConfig`
- **UI component**: `src/components/pages/ModernConfiguration.tsx` - Tab 1 (index === 1)

All ~60 configuration options are now properly mapped from the UI to the backend.

## Related Files

- Settings UI: `src/components/pages/ModernConfiguration.tsx`
- Backend service: `src/server/services/LlamaService.ts`
- Config file: `.llama-proxy-config.json`
- Server startup: `server.js`

## Verification

To verify settings are being applied:

1. Check server logs when starting:
   ```
   🚀 Spawning llama-server with args: --host 127.0.0.1 --port 8134 -c 4096 ...
   ```

2. Each setting should appear in the args list above

3. If a setting doesn't appear, it either:
   - Has a default value (not needed)
   - Is disabled/not set
   - Needs to be configured in the settings UI
