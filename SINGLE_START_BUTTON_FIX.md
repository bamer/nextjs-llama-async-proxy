# Single Smart Start Button - Implementation

## What Was Fixed

Removed the redundant "Launch with Preset" button. Now there's **only ONE start button** that intelligently handles both scenarios:
- **No preset selected** → "▶ Start Router" (normal start)
- **Preset selected** → "▶ Start with Preset" (launch with preset)

## Changes Made

### File: `public/js/components/router-card.js`

#### 1. Smart handleStart() Method
```javascript
async handleStart(event) {
  event.preventDefault();
  event.stopPropagation();
  this.state.routerLoading = true;
  this._updateUI();

  // If preset selected, launch with preset; otherwise start normally
  if (this.state.selectedPreset) {
    await this.handleLaunchPreset(event);
  } else {
    this.state.onAction("start");
  }
}
```

**Logic:**
- Check if `this.state.selectedPreset` has a value
- If YES: Call `handleLaunchPreset()` (uses socket event `llama:start-with-preset`)
- If NO: Call normal start action

#### 2. Dynamic Button Text
```javascript
Component.h(
  "button",
  { className: "btn btn-primary", "data-action": "start" },
  this.state.routerLoading
    ? "▶ Starting..."
    : this.state.selectedPreset
    ? "▶ Start with Preset"
    : "▶ Start Router"
)
```

**Button shows:**
- "▶ Starting..." (during loading)
- "▶ Start with Preset" (when preset selected)
- "▶ Start Router" (when no preset selected)

#### 3. Removed Duplicate Button
- Deleted the separate "🚀 Launch with Preset" button
- Removed `"click [data-action=launch-preset]"` from event map
- Cleaned up `_updateUI()` (removed preset button update logic)

## Visual Result

### Before
```
┌──────────────────────────────────────────────────────┐
│ 🦙 Llama Router                    [RUNNING]         │
├──────────────────────────────────────────────────────┤
│ [📋 Select...] [⏹ Stop] [🔄 Restart] [🚀 Launch Preset] │
│
│ ❌ TWO ways to start = confusing
└──────────────────────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────────┐
│ 🦙 Llama Router                    [RUNNING] │
├──────────────────────────────────────────────┤
│ [📋 Select...] [⏹ Stop] [🔄 Restart]        │
│
│ ✓ ONE button for start = clean & smart
└──────────────────────────────────────────────┘
```

### With Preset Selected
```
┌──────────────────────────────────────────────┐
│ 🦙 Llama Router                    [STOPPED] │
├──────────────────────────────────────────────┤
│ [📋 fast-inference ▼] [▶ Start with Preset]  │
│
│ Button automatically shows "Start with Preset"
└──────────────────────────────────────────────┘
```

## Behavior

### Scenario 1: No Preset Selected
```
User sees: ▶ Start Router button
User clicks: → Normal router start
             → Router launches without preset config
```

### Scenario 2: Preset Selected
```
User selects: "fast-inference" from dropdown
Button changes to: ▶ Start with Preset
User clicks: → handleStart()
             → Checks this.state.selectedPreset
             → Found! Calls handleLaunchPreset()
             → Launches with preset config
```

### Scenario 3: Change Preset Selection
```
Dropdown was: "fast-inference"
Button text: "▶ Start with Preset"
User changes to: "quality-mode"
Button updates: Still "▶ Start with Preset" ✓
User clicks: Launches with "quality-mode" config
```

## Event Flow

```
User clicks Start Button
    ↓
handleStart()
    ├─ this.state.selectedPreset?
    │  ├─ YES → handleLaunchPreset()
    │  │         └─ stateManager.request("llama:start-with-preset", ...)
    │  └─ NO → this.state.onAction("start")
    │          └─ Normal router start
    ↓
_updateUI()
    └─ Updates button text & state
```

## Code Removed (Cleanup)

1. **Separate "Launch with Preset" button** - No longer needed
2. **`"click [data-action=launch-preset]"` handler** - Integrated into start button
3. **Launch preset button update logic** - Integrated into start button text logic
4. **Redundant UI update code** - Consolidated into _updateUI()

## Testing Checklist

- [ ] Navigate to Dashboard
- [ ] See preset dropdown in router card
- [ ] Don't select a preset → Button shows "▶ Start Router"
- [ ] Select a preset → Button shows "▶ Start with Preset"
- [ ] Click start button without preset → Router starts normally
- [ ] Click start button with preset → Router starts with preset config
- [ ] Change preset selection → Button text updates accordingly
- [ ] During launch → Button shows "▶ Starting..."

## Benefits

✓ **Single Button** - One clear way to start
✓ **Smart Logic** - Detects preset and acts accordingly
✓ **Clear UX** - Button text always shows what will happen
✓ **Less Code** - Removed ~20 lines of duplicate code
✓ **Reduced Confusion** - Users won't wonder which button to click
✓ **Consistent** - Same pattern everywhere

## Summary

The router card now has a **single intelligent Start button** that:
- Shows appropriate text based on preset selection
- Automatically launches with or without preset
- No redundant buttons or confusing options
- Clean, minimal interface

🎉 Done! Much cleaner now.
