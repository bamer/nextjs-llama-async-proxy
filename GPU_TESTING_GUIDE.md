# GPU Detection & Display - Testing & Debugging Guide

## Quick Fixes Applied

### ✅ Server-Side Changes

1. **gpu-detector.js**
   - ✅ Added comprehensive console logging at each detection stage
   - ✅ Improved AMD integrated GPU detection with more flexible bus topology patterns
   - ✅ Better error handling and debug output
   - ✅ Log each GPU found with vendor, name, and VRAM

2. **gpu-monitor.js**
   - ✅ Enhanced logging for detection and broadcast events
   - ✅ Exported `buildBroadcastData` for use in handlers
   - ✅ Better error reporting instead of silent failures
   - ✅ Detailed summary of detected GPUs

3. **gpu-handler.js**
   - ✅ Implemented proper socket.IO-first error handling
   - ✅ Added logging for handler invocation
   - ✅ Fixed data structure returned to clients
   - ✅ Proper callback responses with success/error

### ✅ Client-Side Changes

1. **gpu-details.js**
   - ✅ Better distinction between integrated and discrete GPUs
   - ✅ Improved display for GPUs without real-time metrics
   - ✅ Shows GPU type (Integrated/Discrete) in preview
   - ✅ Better messaging about monitoring capabilities

2. **CSS (gpu.css)**
   - ✅ Already has comprehensive styling for all states

## Testing Steps

### Step 1: Verify Server Startup

```bash
pnpm start
```

Look for logs like:
```
[GPU-DETECTOR] Starting comprehensive GPU detection...
[GPU-DETECTOR] Tool availability: { nvidia: true, rocm: false }
[GPU-DETECTOR] Running nvidia-smi to detect NVIDIA GPUs...
[GPU-DETECTOR] Scanning /sys/class/drm for AMD GPUs...
[GPU-DETECTOR] Found AMD device: card0 (vendor: 0x1002)
[GPU-DETECTOR] Detection complete: 2 total GPU(s) found
[GPU-DETECTOR] Summary: NVIDIA=1, AMD=1, Intel=0
[GPU-MONITOR] Detected 2 GPU(s)
  [1] NVIDIA - GeForce RTX 3070 Ti (12288MiB, integrated=false)
  [2] AMD - Radeon (Integrated) (8192MiB, integrated=true)
```

### Step 2: Check Browser Console

Open browser DevTools (F12) → Console tab, look for:

```
[GpuDetails] Failed to load: ...  // If there's an error
[DEBUG] API request: gpu:status
[DEBUG] API response: { ... }    // GPU data
```

### Step 3: Verify Socket.IO Communication

In browser console, run:

```javascript
// Check if socketClient is connected
console.log("Connected:", socketClient.isConnected);

// Request GPU status
const resp = await socketClient.request("gpu:status", {});
console.log("GPU Status Response:", resp);

// Should show:
// {
//   success: true,
//   data: {
//     list: [ ... GPU objects ... ],
//     count: 2,
//     usage: 15.5,
//     memoryUsed: 2147483648,
//     memoryTotal: 20971520000,
//     ...
//   },
//   timestamp: "2024-01-19T..."
// }
```

### Step 4: Test Dashboard Display

1. Navigate to Dashboard page
2. Scroll to GPU Devices section
3. Verify both GPUs are shown:
   - **GPU 1**: NVIDIA card with full metrics
   - **GPU 2**: AMD Integrated card with limited metrics

Expected layout:

```
┌─────────────────────────────────────────┐
│ GPU Devices (2)                   Total │
├─────────────────────────────────────────┤
│ 🟩 GeForce RTX 3070 Ti [65.2%]          │
│    Discrete · RTX · Driver: 555.42      │
│    ▼ [Expand arrow]                     │
├─────────────────────────────────────────┤
│ 🔺 Radeon (Integrated) [N/A]            │
│    Integrated · AMD iGPU                │
│    ▼ [Expand arrow]                     │
└─────────────────────────────────────────┘
```

### Step 5: Test Real-Time Updates

1. Open GPU card (click expand arrow)
2. Run a GPU-intensive task in another terminal:

```bash
# Option 1: Stress test NVIDIA
nvidia-smi -q -l 1  # Monitor in parallel

# Option 2: Use cuda samples (if installed)
/usr/local/cuda/samples/1_Utilities/deviceQuery

# Option 3: Python GPU test
python3 << 'EOF'
import torch
x = torch.randn(1000, 1000, device='cuda')
for i in range(100):
    y = torch.matmul(x, x)
    print(f"Iteration {i+1}")
EOF
```

3. Watch the GPU metrics update every 2 seconds:
   - GPU Usage % should change
   - Memory bars should animate
   - Temperature may increase
   - Power draw should update

### Step 6: Force GPU Detection

In browser console:

```javascript
// Force GPU refresh button click
const btn = document.querySelector('[data-action="gpu-refresh"]');
if (btn) btn.click();

// Or directly request detection
const resp = await socketClient.request("gpu:detect", {});
console.log("Detection result:", resp);
```

## Debugging Commands

### Check System GPU Info

```bash
# List all GPUs
lspci | grep -E "VGA|3D|Display"

# Check NVIDIA GPUs
nvidia-smi --query-gpu=index,name,memory.total,driver_version --format=csv,noheader

# Check AMD GPUs
rocm-smi --showid --showmeminfo --json 2>/dev/null || amd-smi metrics --json

# Check sysfs
ls -la /sys/class/drm/
for i in /sys/class/drm/card*; do
  echo "=== $(basename $i) ==="
  cat "$i/device/vendor" 2>/dev/null | xargs -I {} printf "Vendor: %s\n" {}
  realpath "$i/device" | sed 's/^/PCI Path: /'
done
```

### Monitor Server Logs

```bash
# Terminal 1: Start server with debug output
DEBUG=* pnpm start

# Terminal 2: Watch specific GPU logs
tail -f logs/*.log | grep -E "\[GPU|gpu"
```

### Test Socket Events

```bash
# Monitor all socket events in browser console
const originalEmit = socketClient.socket.emit;
socketClient.socket.emit = function(...args) {
  console.log("[SOCKET-EMIT]", args[0], args[1]);
  return originalEmit.apply(this, args);
};

const originalOn = socketClient.socket.on;
socketClient.socket.on = function(event, handler) {
  if (event.includes('gpu')) {
    console.log("[SOCKET-ON]", event);
  }
  return originalOn.apply(this, event, function(...args) {
    if (event.includes('gpu')) {
      console.log("[SOCKET-EVENT]", event, args[0]);
    }
    return handler.apply(this, args);
  });
};
```

## Expected Console Output

### Server Startup
```
[GPU-DETECTOR] Starting comprehensive GPU detection...
[GPU-DETECTOR] Tool availability: { nvidia: true, rocm: false }
[GPU-DETECTOR] Running nvidia-smi to detect NVIDIA GPUs...
[GPU-DETECTOR] nvidia-smi returned 1 GPU(s)
[GPU-DETECTOR] NVIDIA GPU 0: NVIDIA GeForce RTX 3070 Ti, 12288MiB VRAM
[GPU-DETECTOR] Found 1 NVIDIA GPU(s)
[GPU-DETECTOR] Starting AMD GPU detection...
[GPU-DETECTOR] Scanning /sys/class/drm for AMD GPUs...
[GPU-DETECTOR] Found AMD device: card0 (vendor: 0x1002)
[GPU-DETECTOR] card0 real path: /sys/devices/pci0000:00/0000:00:08.1/drm/card0
[GPU-DETECTOR] card0 VRAM file: 0 bytes
[GPU-DETECTOR] card0 Detection: isBehindBridge=true, isBehindHighPCI=false, isIntegrated=true
[GPU-DETECTOR] card0 shared memory: 8589934592 bytes
[GPU-DETECTOR] card0 Final: name="AMD Radeon Graphics", integrated=true, vram=8192MiB
[GPU-DETECTOR] Found 1 AMD GPU(s) via sysfs
[GPU-DETECTOR] AMD sysfs detection found 1 GPU(s)
[GPU-DETECTOR] AMD detection complete: 1 GPU(s)
[GPU-DETECTOR] Detection complete: 2 total GPU(s) found
[GPU-DETECTOR] Summary: NVIDIA=1, AMD=1, Intel=0
[GPU-MONITOR] Detected 2 GPU(s)
  [1] NVIDIA - NVIDIA GeForce RTX 3070 Ti (12288MiB, integrated=false)
  [2] AMD - AMD Radeon Graphics (Integrated) (8192MiB, integrated=true)
```

### Browser DevTools
```
[GpuDetails] onMount
[DEBUG] API request: gpu:status {}
[DEBUG] API response: {
  success: true,
  data: {
    list: [
      { vendor: 'NVIDIA', name: '...' },
      { vendor: 'AMD', name: '...', isIntegrated: true }
    ],
    count: 2,
    ...
  }
}
```

## Common Issues & Solutions

### Issue: Only 1 GPU shown (missing AMD iGPU)

**Cause**: Bus topology detection too strict or shared memory not found

**Solution**:
1. Check server logs for `[GPU-DETECTOR]` messages
2. Run diagnostic command:
   ```bash
   for i in /sys/class/drm/card*; do
     echo "=== $(basename $i) ==="
     cat "$i/device/vendor"
     realpath "$i/device"
     cat "$i/device/mem_info_vram_total" 2>/dev/null || echo "No VRAM file"
     cat "$i/device/mem_info_shared_total" 2>/dev/null || echo "No shared mem"
   done
   ```
3. Look for patterns in real paths

### Issue: GPU metrics show N/A for NVIDIA

**Cause**: nvidia-smi not in PATH or query format issue

**Solution**:
```bash
# Test nvidia-smi directly
/usr/bin/nvidia-smi --query-gpu=index,name,memory.total --format=csv,noheader,nounits

# Check PATH
echo $PATH

# Run server with full PATH
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin pnpm start
```

### Issue: Updates not real-time (stuck at initial values)

**Cause**: Socket broadcast not working or component not listening

**Solution**:
1. Check browser console for socket events
2. Verify gpu-monitor is polling:
   ```javascript
   // In browser console
   socketClient.on("gpu:updated", (data) => {
     console.log("GPU Update received:", new Date().toISOString(), data);
   });
   ```
3. Check server logs for `[GPU-MONITOR] Detected`

### Issue: Integrated GPU shows 0 MiB VRAM

**Cause**: Shared memory detection failed

**Solution**:
1. Check available memory info files:
   ```bash
   ls -la /sys/class/drm/card0/device/mem_info_*
   ```
2. If files don't exist, GPU may need different detection method
3. Check kernel version (needs DRM support)

## Performance Notes

- **Detection**: Runs once at startup, ~500ms
- **Metrics polling**: Every 2 seconds, ~100ms per update
- **Socket.IO broadcast**: Once per poll cycle to all connected clients
- **DOM updates**: Only when data changes (compared to previous update)

## Files Modified

| File | Changes |
|------|---------|
| `server/services/gpu-detector.js` | Detection logic + logging |
| `server/services/gpu-monitor.js` | Broadcast + logging |
| `server/handlers/gpu-handler.js` | Socket handlers + error handling |
| `public/js/components/dashboard/gpu-details.js` | UI improvements |

## Next Steps

1. **Test on actual hardware** with your 2 GPUs
2. **Monitor server logs** during startup
3. **Check browser console** for any JS errors
4. **Verify Socket.IO events** are being received
5. **Run GPU stress test** and watch metrics update
6. If issues persist, capture logs and share diagnostic output

## Rollback Plan

If something breaks:

```bash
# Revert all changes
git checkout server/services/gpu-detector.js
git checkout server/services/gpu-monitor.js
git checkout server/handlers/gpu-handler.js
git checkout public/js/components/dashboard/gpu-details.js

# Restart server
pnpm start
```
