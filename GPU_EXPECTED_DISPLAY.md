# GPU Card Expected Display - After All Fixes

## GPU Devices Card Layout

### Header Section
```
┌────────────────────────────────────────────────────────┐
│ GPU Devices (2)                                   ⟳ ▼  │
│ Total: 12.2 GB · 20% avg                              │
└────────────────────────────────────────────────────────┘
```

---

## Card 1: NVIDIA GPU (Collapsed)

```
┌────────────────────────────────────────────────────────┐
│ 🟩 NVIDIA GeForce GTX 1070 [35.2%]             ▶      │
│    Discrete · NVIDIA · Driver: 580.126.09             │
├────────────────────────────────────────────────────────┤
│ Memory: 3.2 GB / 8 GB                                  │
│ Temp: 42°C    Power: 18.5 W                            │
│ [████████░░░░░░░░░░░░░░░░░░░░░░] (40%)                │
│ Monitoring: Full real-time metrics                     │
└────────────────────────────────────────────────────────┘
```

### Card 1: NVIDIA GPU (Expanded)

```
┌────────────────────────────────────────────────────────┐
│ 🟩 NVIDIA GeForce GTX 1070 [35.2%]             ▼      │
│    Discrete · NVIDIA · Driver: 580.126.09             │
├────────────────────────────────────────────────────────┤
│ Memory: 3.2 GB / 8 GB                                  │
│ Temp: 42°C    Power: 18.5 W                            │
│ [████████░░░░░░░░░░░░░░░░░░░░░░] (40%)                │
│ Monitoring: Full real-time metrics                     │
├────────────────────────────────────────────────────────┤
│ GPU Usage                 35.2%                        │
│ [███████░░░░░░░░░░░░░░░░░░░░░░░░]                      │
│                                                        │
│ Memory Usage              3.2 GB / 8 GB               │
│ [████████░░░░░░░░░░░░░░░░░░░░░░░░]                     │
│                                   40.0% used           │
│                                                        │
│ Temperature               42°C                         │
│                                                        │
│ Power                     18.5 W                       │
│                                                        │
│ Fan                       45%                          │
│ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░]                     │
│                                                        │
│ Core Clock                2000 MHz                     │
│                                                        │
│ Memory Clock              5005 MHz                     │
│                                                        │
│ Total VRAM                8 GB                         │
│                                                        │
│ Info                      Driver 580.126.09            │
└────────────────────────────────────────────────────────┘
```

---

## Card 2: AMD Integrated GPU (Collapsed)

```
┌────────────────────────────────────────────────────────┐
│ 🔺 AMD GPU (Integrated) [N/A]                  ▶       │
│    Integrated · AMD iGPU                               │
├────────────────────────────────────────────────────────┤
│ Memory: 0 B / 4 GB                                     │
│ Type: Integrated                                       │
│ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  (0%)              │
│ Monitoring: Integrated - Real-time metrics limited    │
└────────────────────────────────────────────────────────┘
```

### Card 2: AMD Integrated GPU (Expanded)

```
┌────────────────────────────────────────────────────────┐
│ 🔺 AMD GPU (Integrated) [N/A]                  ▼       │
│    Integrated · AMD iGPU                               │
├────────────────────────────────────────────────────────┤
│ Memory: 0 B / 4 GB                                     │
│ Type: Integrated                                       │
│ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  (0%)              │
│ Monitoring: Integrated - Real-time metrics limited    │
├────────────────────────────────────────────────────────┤
│ GPU Usage                 Integrated                   │
│ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]                     │
│ (No real-time metrics for integrated GPUs)             │
│                                                        │
│ Memory Usage              0 B / 4 GB                   │
│ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]                     │
│                                    0.0% used           │
│                                                        │
│ Total VRAM                4 GB                         │
│                                                        │
│ Info                      Integrated AMD Graphics      │
└────────────────────────────────────────────────────────┘
```

---

## Visual Elements

### Progress Bars

**High Usage** (>85% or >90%):
```
[████████████████████████████████] 95% (RED - Danger)
```

**Medium Usage** (50-85%):
```
[█████████████░░░░░░░░░░░░░░░░░░░░] 65% (ORANGE - Warning)
```

**Low Usage** (<50%):
```
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░] 25% (GREEN - OK)
```

**No Data** (N/A):
```
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] N/A (GRAY - Inactive)
```

---

## Real-Time Updates

Both cards update every 2 seconds:

✅ **NVIDIA GPU**:
- GPU Usage % changes
- Memory Usage changes
- Progress bars animate smoothly
- Temperature updates
- Power draw updates
- Fan speed updates

✅ **AMD Integrated GPU**:
- Memory usage shows current state (usually 0%)
- Card displays as "Integrated - Real-time metrics limited"
- Bars remain static (expected)

---

## Colors & States

### Card Borders
- **Normal**: Light gray border (1px)
- **Warning** (>85% usage or >90% memory): Orange glow
  ```css
  border-color: #f59e0b;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.15);
  ```
- **Animated Warning**: Pulsing orange effect

### Metric Values
- **Normal**: Light gray text
- **High/Danger**: Red text (`#ef4444`)
- **Warning**: Orange text (`#f59e0b`)
- **N/A/Inactive**: Darker gray (`#64748b`)

### Progress Bars
- **GPU Usage**: Purple → Pink gradient
  ```
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  ```
- **VRAM**: Orange → Red gradient
  ```
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  ```
- **Fan**: Cyan → Blue gradient
  ```
  background: linear-gradient(90deg, #06b6d4, #3b82f6);
  ```
- **Inactive**: Gray
  ```
  background: rgba(148, 163, 184, 0.2);
  ```

---

## Vendor Icons

- 🟩 **NVIDIA**: Green square
- 🔺 **AMD**: Red triangle  
- ▢ **Intel**: Blue square
- 🎮 **Unknown**: Game controller (fallback)

---

## Key Features

### Both Cards Show
- ✅ GPU Name (real or "Unknown")
- ✅ Vendor + Type (Integrated/Discrete)
- ✅ Memory Usage progress bar (always)
- ✅ GPU Usage progress bar (if available)
- ✅ Expand/Collapse toggle
- ✅ Refresh button

### NVIDIA Card Shows (Full Metrics)
- ✅ GPU Usage % with progress bar
- ✅ Memory Used/Total with progress bar
- ✅ Temperature (°C)
- ✅ Power Draw (W)
- ✅ Fan Speed %
- ✅ Core Clock (MHz)
- ✅ Memory Clock (MHz)
- ✅ Total VRAM
- ✅ Driver version

### AMD Integrated Card Shows (Limited Metrics)
- ⚠️ GPU Usage: "Integrated" (no real-time data)
- ✅ Memory Used/Total (usually 0/X for integrated)
- ❌ Temperature (unavailable)
- ❌ Power Draw (unavailable)
- ✅ Type badge showing "Integrated"
- ✅ Clear message: "Real-time metrics limited"

---

## Browser Console Output

When GPU cards load:

```
[GpuDetails] onMount
[GpuDetails] Requesting gpu:status from socket...
[GpuDetails] gpu:status response: { success: true, data: { list: [...] } }
[GpuDetails] Got GPU data: { list: [2 GPU objects] }
[GpuDetails] Handling GPU update with 2 GPUs
[GpuDetails] Updated gpuList to: (2) [{...}, {...}]
[GpuDetails] gpu:updated broadcast received: { type: "broadcast", data: {...} }
[GpuDetails] Handling GPU update with 2 GPUs
[GpuDetails] Updated gpuList to: (2) [{...}, {...}]
```

Repeats every 2 seconds for updates.

---

## Server Console Output

At startup:

```
[GPU-DETECTOR] Starting comprehensive GPU detection...
[GPU] Tool availability: { nvidia: true, rocm: false }
[GPU-DETECTOR] Running nvidia-smi to detect NVIDIA GPUs...
[GPU-DETECTOR] NVIDIA GPU 0: NVIDIA GeForce GTX 1070, 8192MiB VRAM
[GPU-DETECTOR] Found 1 NVIDIA GPU(s)
[GPU-DETECTOR] Starting AMD GPU detection...
[GPU-DETECTOR] Found AMD device: card1 (vendor: 0x1002)
[GPU-DETECTOR] card1 Detection: isBehindBridge=true, isBehindHighPCI=false, isIntegrated=true
[GPU-DETECTOR] Found 1 AMD GPU(s) via sysfs
[GPU-DETECTOR] Detection complete: 2 total GPU(s) found
[GPU-DETECTOR] Summary: NVIDIA=1, AMD=1, Intel=0
[GPU-MONITOR] Detected 2 GPU(s)
  [1] NVIDIA - NVIDIA GeForce GTX 1070 (8192MiB, integrated=false)
  [2] AMD - AMD GPU (Integrated) (4096MiB, integrated=true)
[GPU-MONITOR] Broadcasted gpu:updated event
```

Every 2 seconds:
```
[GPU-MONITOR] Broadcasted gpu:updated event
[GPU-HANDLER] gpu:status responded with 2 GPU(s)
```

---

## Interaction

### Expand/Collapse
- Click header or click toggle arrow (▶/▼)
- Smooth animation
- Preserves state per GPU

### Refresh Button
- Click ⟳ button in GPU Devices header
- Forces GPU detection
- Updates both cards
- Shows loading spinner briefly

### Hover Effects
- Card header highlights on hover
- Buttons highlight on hover
- Progress bars animate smoothly on update

---

## What Should NOT Happen

❌ Empty GPU list
❌ "Unknown" GPU names
❌ 0 MiB VRAM
❌ Missing progress bars
❌ Static metrics (not updating)
❌ JavaScript console errors
❌ Socket connection failures
❌ "GPU Devices (0)" header

---

## Troubleshooting

If you see "Unknown GPU" or missing names:
1. Check server logs for `[GPU-DETECTOR]` messages
2. Run `node test-gpu-detection.js`
3. Verify `nvidia-smi` works on your system
4. Check `/sys/class/drm/` has GPU devices

If progress bars don't update:
1. Check browser network tab (F12)
2. Look for `gpu:updated` events in DevTools
3. Run GPU stress test in another terminal
4. Check that metrics are actually changing

If card shows only AMD GPU:
1. Check NVIDIA driver is installed
2. Run `nvidia-smi` in terminal
3. Check server logs for nvidia-smi errors
4. Verify no errors in browser console

---

## Performance

- Initial load: ~500ms (GPU detection)
- Updates: Every 2 seconds
- Progress bars animate smoothly (300ms transition)
- No lag or stuttering
- Memory usage: ~1-2 MB

---

## Accessibility

- Semantic HTML structure
- Color coding + text labels (not just colors)
- Expandable sections (keyboard navigable)
- Proper contrast ratios
- Loading states clearly indicated
