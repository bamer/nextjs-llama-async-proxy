# GPU Detection & Display - Comprehensive Debug Analysis

## Problem Summary

The GPU details card is showing:
1. **Only 1 GPU** when system has **2 GPUs** (NVIDIA discrete + AMD integrated iGPU)
2. **Incorrect/missing metrics** (memory usage, utilization not showing or updating correctly)
3. **No real-time updates** - data appears static
4. Server logs show: `GPU] Tool availability: { nvidia: true, rocm: false }`

## Root Causes Identified

### Issue #1: AMD Integrated GPU Detection (CRITICAL)

**Location**: `server/services/gpu-detector.js:260-362` (`detectAmdSysfs()`)

**Root Cause**: The integrated AMD GPU detection logic is broken.

```javascript
// Lines 285-307: Bus topology detection logic has a flaw
const isBehindSouthbridge = /\/0000:00:0[28]\./.test(devicePathReal);
const isBehindPCIeRoot = /\/0000:00:01\.[0-9]/.test(devicePathReal);
const isIntegrated = isBehindSouthbridge && !isBehindPCIeRoot;
```

**Problems**:
- The regex pattern `/\/0000:00:0[28]\./` only matches `00:08.` or `00:02.`, but modern AMD APUs use various bridges
- The logic fails for different system architectures
- Integrated GPUs may not be detected at all or are filtered out silently
- No debug logging to see what's happening

### Issue #2: ROCm SMI Discrete-Only Filter Too Aggressive

**Location**: `server/services/gpu-detector.js:156-177`

**Problem**: The code filters for `discreteGpus` but the filter is based on:
```javascript
const discreteGpus = sysfsGpus.filter(g => !g.isIntegrated && g.vramTotalBytes > 0);
```

If `isIntegrated` is incorrectly marked or VRAM detection fails, discrete GPUs are silently dropped.

### Issue #3: No Debug Logging in Detection Chain

**Locations**:
- `gpu-detector.js` - no logging for what GPUs are found/skipped
- `gpu-monitor.js` - limited logging about detection results
- Missing visibility into the detection pipeline

### Issue #4: Component Not Handling Both Metrics & Non-Metrics GPUs

**Location**: `public/js/components/dashboard/gpu-details.js:210, 239, 275`

```javascript
const hasMetrics = gpu.vendor === "NVIDIA" || gpu.isRocmCapable;
```

**Problem**: 
- AMD integrated GPUs will have `isRocmCapable = false` (correct)
- But the component won't display any metrics section for them
- Should still show VRAM info from sysfs even if no real-time metrics available

### Issue #5: Socket Handler Returning Wrong Data Structure

**Location**: `server/handlers/gpu-handler.js`

**Problem**: The `gpu:status` handler should return the full broadcast data structure, but it's returning `status.data` which may be incomplete.

### Issue #6: Metrics Not Updating for AMD iGPU

**Location**: `server/services/gpu-monitor.js:152-181` (`collectGpuMetricsOnly()`)

**Problem**: AMD integrated GPUs skip metrics collection entirely:
```javascript
if (gpu.isRocmCapable) {
  updatedGpu = await updateRocmMetrics(updatedGpu);
} else {
  // AMD integrated GPU - no metrics available via sysfs, keep existing
}
```

No real-time memory usage collection even if available via sysfs.

## Required Fixes

### Fix #1: Improve AMD Integrated GPU Detection

- Better bus topology detection
- Add fallback detection methods
- Add comprehensive logging
- Test across different AMD APU architectures

### Fix #2: Improve ROCm Detection

- Make discrete GPU detection more robust
- Add logging for what's being filtered
- Better error handling for rocm-smi failures

### Fix #3: Add Real-Time Memory Monitoring for AMD iGPU

- Use sysfs to get shared memory usage stats if available
- Parse `/sys/kernel/debug/dri/` for GPU memory info
- Alternative: use `memstat` or similar tools

### Fix #4: Enhance Component Display

- Show full metrics for all GPU types
- Better handling of "no metrics available" state
- Show total VRAM for integrated GPUs from sysfs
- Add helpful messages explaining why metrics are N/A

### Fix #5: Fix Socket Handlers

- Ensure proper data structure returned
- Add request logging for debugging

### Fix #6: Add Comprehensive Logging

- Log every step of GPU detection
- Log metrics collection results
- Make troubleshooting easier

## System Information Needed

To properly debug this, we need:

```bash
# Check what GPUs exist
lspci | grep -E "VGA|3D|Display"
ls -la /sys/class/drm/

# Check vendor IDs
for i in /sys/class/drm/card*; do 
  [ -f "$i/device/vendor" ] && echo "$(basename $i): $(cat $i/device/vendor)"
done

# Check bus topology
for i in /sys/class/drm/card*; do 
  [ -f "$i/device" ] && echo "$(basename $i): $(realpath $i/device)"
done

# Check available tools
which nvidia-smi
which rocm-smi
which amd-smi

# Check shared memory paths
ls -la /sys/class/drm/card0/device/ | grep mem
cat /sys/class/drm/card0/device/mem_info_*
```

## Implementation Order

1. **First**: Add comprehensive logging to detection chain
2. **Second**: Fix AMD integrated GPU detection logic
3. **Third**: Implement AMD iGPU metrics collection from sysfs
4. **Fourth**: Fix socket handlers and data structures
5. **Fifth**: Enhance UI component for better display
6. **Sixth**: Test with actual hardware

## Files to Modify

1. `server/services/gpu-detector.js` - AMD detection + logging
2. `server/services/gpu-monitor.js` - Metrics collection + logging
3. `server/handlers/gpu-handler.js` - Socket handlers
4. `public/js/components/dashboard/gpu-details.js` - UI enhancements
5. `public/css/components/gpu.css` - Visual improvements (if needed)

## Expected Outcomes

✅ Both GPUs detected (NVIDIA discrete + AMD integrated)
✅ Correct names and vendor info displayed
✅ VRAM totals displayed for both GPUs
✅ Real-time metrics for NVIDIA GPU
✅ AMD iGPU shows "Integrated - monitoring limited" with best-effort metrics
✅ Progress bars update every 2 seconds
✅ Console logs show clear detection flow for debugging
