# Presets - Model Loading Fix

## Problem
When trying to add models to a group or as standalone, users got "Please scan for models first" error, even though models were already visible in the Models page.

## Root Cause
The `availableModels` list was empty because:
1. `loadAvailableModels()` was called in `didMount()` but happened before the socket was ready
2. Models were never actually loaded until the user tried to add one
3. The service call to `getAvailableModels()` returned an empty list

## Solution

### 1. **Load Models with Preset Data**
Models are now loaded **when a preset is selected**, not when the page mounts:
```javascript
// In loadPresetData()
const [models, defaults, availableModels] = await Promise.all([
  service.getModelsFromPreset(preset.name),
  service.getDefaults(preset.name),
  service.getAvailableModels(),  // NEW: Load available models
]);
this.setState({ availableModels });
```

**Why this works:** By the time a preset is selected, the socket is definitely connected and ready.

### 2. **Add Manual Refresh Button**
Users can now click "↻ Refresh Models" in the header to reload the available models list:
- Click the button anytime
- Shows count of found models
- Updates the list for adding

**User workflow:**
1. Create/select preset
2. Click "↻ Refresh Models" if needed
3. Click "+ Add Model" - list is now populated

### 3. **Removed Unnecessary Code**
- Removed `loadAvailableModels()` method (no longer needed)
- Cleaned up `didMount()` comment
- Consolidated all loading into `loadPresetData()`

---

## Changes Made

### File: `public/js/pages/presets.js`

**1. Updated `loadPresetData()`**
```javascript
// Before: Only loaded models and defaults
const [models, defaults] = await Promise.all([...])

// After: Also loads available models
const [models, defaults, availableModels] = await Promise.all([
  service.getModelsFromPreset(preset.name),
  service.getDefaults(preset.name),
  service.getAvailableModels(),  // NEW
]);
this.setState({ availableModels });  // NEW
```

**2. Added `handleRefreshModels()` handler**
```javascript
handleRefreshModels() {
  // Load available models on demand
  // Shows notification with count
}
```

**3. Updated `renderHeader()`**
```javascript
// Added refresh button in header-top section
Component.h("button", {
  className: "btn btn-secondary btn-sm refresh-models-btn",
  "data-action": "refresh-models",
  title: "Refresh available models list",
}, "↻ Refresh Models")
```

**4. Updated event map**
```javascript
"click [data-action=refresh-models]": "handleRefreshModels",
```

**5. Removed/cleaned up**
- Removed `loadAvailableModels()` method
- Cleaned `didMount()` with comment

### File: `public/css/pages/presets/presets.css`

**Added styles:**
```css
.presets-header .header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.refresh-models-btn {
  flex-shrink: 0;
}
```

---

## User Workflow

### Scenario 1: Normal Usage
1. Navigate to Presets page
2. Create a new preset (or select existing)
3. Models automatically load ✅
4. Click "+ Add Model"
5. Select from the populated list ✅

### Scenario 2: Added Models Since Last Visit
1. Go to Models page, add new models to filesystem
2. Return to Presets
3. Click "↻ Refresh Models"
4. List updates with new models ✅

### Scenario 3: Models Not Showing
1. Check that models exist in the models directory
2. Click "↻ Refresh Models" button
3. If still empty, check server logs for errors
4. Verify `baseModelsPath` configuration

---

## Testing Checklist

- [ ] Navigate to Presets
- [ ] Create/select a preset
- [ ] Try to add model - should show available models list ✅
- [ ] Click "↻ Refresh Models" - shows success message
- [ ] Click "+ Add Model" after refresh - list is populated
- [ ] Add a model to group - should appear in list
- [ ] Add a model as standalone - should be editable
- [ ] Add another model to same group - should append
- [ ] Delete a model - should disappear from list
- [ ] Test in both dark and light themes

---

## Error Handling

If models still don't show:

1. **Check server logs** for `presets:available-models` event
2. **Verify baseModelsPath** is configured correctly:
   - Settings → Configuration
   - Look for "Base Models Path"
3. **Check file system** - models directory must exist
4. **Models must be .gguf files** in the configured directory
5. **Click Refresh** to retry loading

**Error message:** If models can't be found, you'll see:
```
"Please scan for models first." 
```

**Solution:** Click "↻ Refresh Models" or check configuration.

---

## Performance Impact

✅ **Positive:**
- Models only loaded once per preset selection (not on page mount)
- Prevents unnecessary scans
- User has control with refresh button

⚠️ **Consideration:**
- If models directory is very large, first selection might be slow
- Subsequent refreshes are the same speed
- Recommend keeping model directory reasonably organized

---

## Backward Compatibility

✅ **Fully compatible:**
- No database changes
- No API changes
- Just UI/loading behavior changed
- Existing presets still work

---

## Files Modified

1. `public/js/pages/presets.js` - Loading and UI logic
2. `public/css/pages/presets/presets.css` - Styling for header

---

## Testing Status

✅ **Code Quality:**
- Syntax: VALID
- Linting: CLEAN
- Formatting: APPLIED

⏳ **Functional Testing:**
- PENDING - Browser testing needed

---

## Summary

Users can now **add models to presets** without getting the "scan first" error. Models are automatically loaded when a preset is selected, and users can manually refresh if needed. The fix is simple, reliable, and non-breaking.
