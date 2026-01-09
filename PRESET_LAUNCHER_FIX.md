# Fix: Preset Launcher Visibility in Dashboard Router Card

## Problem
The preset selection dropdown was not visible in the Llama Router card on the Dashboard page. The conditional rendering check `this.state.presets && this.state.presets.length > 0` was failing because presets data was not being loaded.

## Root Cause
The `DashboardController` was not loading presets data, so `stateManager.get("presets")` returned an empty array, preventing the preset launcher section from rendering.

## Solution
Updated `DashboardController` to load presets similar to how `SettingsController` does it.

## Changes Made

### File: `public/js/pages/dashboard/controller.js`

#### 1. Updated `render()` method (lines 24-53)
Added retrieval of presets and settings from state manager:
```javascript
const presets = stateManager.get("presets") || [];
const settings = stateManager.get("settings") || {};
```

Then passed to DashboardPage component:
```javascript
this.comp = new window.DashboardPage({
  models,
  metrics,
  status,
  routerStatus,
  config,
  history,
  presets,
  maxModelsLoaded: settings.maxModelsLoaded || 4,
  ctxSize: config.ctx_size || 4096,
  chartManager: this.chartManager,
  controller: this,
});
```

#### 2. Enhanced `load()` method (lines 90-130)
Added two new load operations:

**Load Settings:**
```javascript
try {
  const st = await stateManager.getSettings();
  stateManager.set("settings", st.settings || {});
} catch (e) {}
```

**Load Presets:**
```javascript
try {
  const p = await stateManager.request("presets:list");
  stateManager.set("presets", p?.presets || []);
} catch (e) {
  stateManager.set("presets", []);
}
```

## Data Flow

```
DashboardController.load()
  ├─ stateManager.getSettings()
  │  └─ stateManager.set("settings", ...)
  │
  └─ stateManager.request("presets:list")
     └─ stateManager.set("presets", ...)
         ↓
DashboardController.render()
  ├─ presets = stateManager.get("presets")
  ├─ settings = stateManager.get("settings")
  │
  └─ new DashboardPage({
       presets,
       maxModelsLoaded: settings.maxModelsLoaded,
       ctxSize: config.ctx_size,
       ...
     })
       ↓
   DashboardPage passes to RouterCard
     ├─ presets
     ├─ maxModelsLoaded
     └─ ctxSize
       ↓
   RouterCard renders
     └─ Preset launcher section
        ├─ Select dropdown (visible when presets.length > 0)
        └─ Launch button
```

## Testing Checklist

- [ ] Navigate to Dashboard
- [ ] Verify "Launch with Preset" section appears in Llama Router card
- [ ] Preset dropdown is populated with all created presets
- [ ] Select a preset
- [ ] Click "Launch Server with Preset" button
- [ ] Server starts with selected preset configuration
- [ ] Loading state shows during launch

## Related Files

- `public/js/pages/dashboard/controller.js` - Updated to load presets
- `public/js/pages/dashboard/page.js` - Already had preset props
- `public/js/components/dashboard/router-card.js` - Renders preset launcher
- `public/js/pages/settings/settings-controller.js` - Reference implementation

## Consistency Note

The DashboardController now follows the same pattern as SettingsController:
1. Load settings in the `load()` method
2. Load presets in the `load()` method
3. Pass both to the page component in `render()`
4. Page component passes to RouterCard for rendering
