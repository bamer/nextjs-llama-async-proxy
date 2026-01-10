# Preset Launcher Integration into Router Card

## Overview

Consolidated the "Launch with Preset" functionality into the Llama Router card component, eliminating redundant UI elements and streamlining the user experience.

## Changes Made

### 1. **Dashboard Router Card Enhancement**

**File**: `public/js/components/dashboard/router-card.js`

#### Added State Properties:

- `presets`: Array of available presets
- `selectedPreset`: Currently selected preset for launch
- `routerLoading`: Loading state for preset launch
- `maxModelsLoaded`: Max models for preset launch
- `ctxSize`: Context size for preset launch

#### Added Methods:

- `handlePresetChange()`: Updates selected preset on dropdown change
- `handleLaunchPreset()`: Launches server with selected preset via `llama:start-with-preset` event
- `_updateUI()`: Updates button and badge states without full re-render

#### Updated Event Map:

```javascript
"click [data-action=launch-preset]": "handleLaunchPreset",
"change #preset-select": "handlePresetChange",
```

#### Integrated Preset Launcher Section:

- Moved from separate router-card.js component to dashboard router card
- Rendered conditionally when presets are available
- Includes:
  - Preset selection dropdown
  - Launch button with loading state
  - Helper text referencing Presets page

### 2. **Dashboard Page Props Update**

**File**: `public/js/pages/dashboard/page.js`

#### Added State:

```javascript
presets: props.presets || [],
maxModelsLoaded: props.maxModelsLoaded || 4,
ctxSize: props.ctxSize || 4096,
```

#### Updated RouterCard Props:

```javascript
presets: this.state.presets,
maxModelsLoaded: this.state.maxModelsLoaded,
ctxSize: this.state.ctxSize,
```

### 3. **Settings Page Already Configured**

**File**: `public/js/pages/settings/settings-page.js`

Already passing:

- `presets: this.state.presets`
- `maxModelsLoaded: this.state.maxModelsLoaded`
- `ctxSize: this.state.ctx_size`

### 4. **Legacy Router Card Cleanup**

**File**: `public/js/components/router-card.js`

Removed duplicate "Launch with Preset" section (lines 231-267) since it's now in the dashboard router card.

## Architecture

```
Dashboard/Settings
       ↓
    RouterCard (unified component)
       ├─ Router Controls (Start/Stop/Restart)
       └─ Preset Launcher (conditional, when presets available)
             ├─ Preset Selection Dropdown
             └─ Launch with Preset Button
```

## User Experience Flow

### Before:

- Settings page had separate launch section
- Dashboard and Settings had different launch capabilities

### After:

- Both Dashboard and Settings have consistent router card
- Single unified preset launcher in the router card
- User can launch with preset directly from router card
- No redundant sections or duplicate buttons

## API Integration

The preset launcher uses the existing Socket.IO event:

```javascript
stateManager.request("llama:start-with-preset", {
  presetName: string,
  maxModels: number,
  ctxSize: number,
  threads: number,
});
```

## Loading States

The component properly handles:

- ✓ Disabled preset dropdown during launch
- ✓ Button text changes: "🚀 Launch..." → "🚀 Launch Server with Preset"
- ✓ Status badge updates during operations
- ✓ Error handling and notifications

## Benefits

1. **No Redundancy**: Single launch interface instead of multiple
2. **Consistent UX**: Same interface in Dashboard and Settings
3. **Cleaner Code**: Removed 37 lines from legacy router-card.js
4. **Better Organization**: Preset launch is part of router control UI
5. **Maintainability**: One component to update instead of multiple

## Testing

To verify the integration:

1. **Dashboard**: Navigate to Dashboard → Verify preset launcher appears in Router card
2. **Settings**: Navigate to Settings → Verify same preset launcher in Router card
3. **Preset Selection**: Select a preset → Button becomes enabled
4. **Launch**: Click "Launch Server with Preset" → Server starts with preset config
5. **Loading State**: During launch → Button shows loading state
6. **Cleanup**: Settings → Remove old "Launch with Preset" section if present (already removed)

## Future Enhancements

- Add preset templates/suggestions in dropdown
- Show preset parameters preview before launch
- Quick-edit preset before launch option
