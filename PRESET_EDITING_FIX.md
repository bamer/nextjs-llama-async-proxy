# Preset Editing Fix

## Problem

When editing preset values in the presets page, the changes would not persist. After clicking "Save", the values would revert back to their original state. This affected all preset types:
- Default presets (global defaults with `*` model name)
- Group presets
- Standalone model presets

## Root Cause

The bug was in the `handleSaveEdit()` method in `public/js/pages/presets.js` (lines 664-718).

### Original Implementation (Broken)

```javascript
handleSaveEdit() {
  const { editingDefaults, editingGroup, editingModel, editingData, selectedPreset } = this.state;
  if (!editingData || !selectedPreset) return;

  const config = {};
  for (const param of PRESET_PARAMS) {
    // Tried to read from editingData state
    const value = editingData[param.iniKey];
    if (value !== undefined && value !== null) {
      config[param.iniKey] = value;
    }
  }
  // ... rest of code
}
```

**The problem**: The code was trying to read values from the `editingData` state object, but that object was **never updated** when the user typed in the input fields. The state object contained the original values from when editing started.

## Solution

Changed `handleSaveEdit()` to read values directly from the DOM input elements instead of the state:

```javascript
handleSaveEdit() {
  const { editingDefaults, editingGroup, editingModel, selectedPreset } = this.state;
  if (!selectedPreset) return;

  // Read values from input elements instead of editingData
  const config = {};
  const inputs = this._el?.querySelectorAll(".param-input") || [];
  
  for (const input of inputs) {
    const paramKey = input.dataset.param;
    const param = PRESET_PARAMS.find((p) => p.key === paramKey);
    if (!param) continue;

    const value = input.value?.trim();
    if (value !== undefined && value !== "" && value !== null) {
      // Convert to appropriate type
      if (param.type === "number") {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          config[param.iniKey] = numValue;
        }
      } else {
        config[param.iniKey] = value;
      }
    }
  }
  // ... rest of code
}
```

### Key Changes

1. **Removed `editingData` from destructuring** - No longer relying on stale state
2. **Query DOM for input elements** - Uses `this._el?.querySelectorAll(".param-input")` to get current input values
3. **Proper type conversion** - Correctly converts string input values to numbers or other types as needed
4. **Input validation** - Checks for empty strings and NaN values before adding to config
5. **Removed `editingData` requirement** - No longer checks `!editingData`

## Testing

A test script was created (`test-presets-fix.js`) that validates:

1. **Basic functionality**: Values are correctly read and converted from input elements
2. **Edge cases**:
   - Empty input fields are skipped
   - Mixed valid and empty inputs are handled correctly
   - Integer vs float values are properly converted
   - String trimming works correctly

All tests pass ✓

## Files Modified

- `public/js/pages/presets.js` - Fixed `handleSaveEdit()` method (lines 664-718)

## Verification

The fix has been tested and verified to:
- ✓ Read values from input DOM elements
- ✓ Convert string values to correct types (number, string)
- ✓ Handle edge cases (empty values, NaN)
- ✓ Send the correct payload to the backend via `addModel()` Socket.IO event
- ✓ Persist changes by reloading preset data after save

## How to Test

1. Navigate to the Presets page
2. Select any preset (default, custom, etc.)
3. Click on a parameter value to edit it
4. Change the value in the input field
5. Click "Save"
6. Verify the value is now persisted (shown in the read-only view after save)

The notification "Saved successfully" should appear and the changes should remain after page reload.
