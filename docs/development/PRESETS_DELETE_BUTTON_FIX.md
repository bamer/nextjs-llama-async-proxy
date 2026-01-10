# Presets - Delete Button Fix

## Problem

Clicking the red X button to delete a standalone model or remove from group didn't work - it just opened/closed the panel instead.

## Root Cause

The delete button (×) was inside the section header element which had `data-action="toggle-model"` or `data-action="toggle-group"`. When clicking the X:

1. Click event fired on the delete button (×)
2. Event bubbled up to parent header
3. Parent header's toggle action was triggered instead
4. Model/group expanded/collapsed instead of deleting

## Solution

Added `e.stopPropagation()` to prevent event bubbling:

```javascript
handleDeleteGroup(e) {
  e.stopPropagation();  // ← Prevent event from bubbling
  // ... rest of handler
}

handleDeleteModel(e) {
  e.stopPropagation();  // ← Prevent event from bubbling
  // ... rest of handler
}
```

## How It Works

### Before

```
User clicks × button
    ↓
Delete click event fires
    ↓
Event bubbles UP to parent header
    ↓
Header's toggle action triggers
    ↓
Model/group expands/collapses ❌
```

### After

```
User clicks × button
    ↓
Delete click event fires
    ↓
e.stopPropagation() prevents bubbling
    ↓
Only delete action happens
    ↓
Model/group is deleted ✅
```

## Changes Made

### File: `public/js/pages/presets.js`

**handleDeleteGroup()** - Line 1046

```javascript
handleDeleteGroup(e) {
  e.stopPropagation();  // NEW
  const el = e.target.closest("[data-action=delete-group]");
  // ... rest unchanged
}
```

**handleDeleteModel()** - Line 1189

```javascript
handleDeleteModel(e) {
  e.stopPropagation();  // NEW
  const el = e.target.closest("[data-action=delete-model]");
  // ... rest unchanged
}
```

## Affected Buttons

This fix applies to:

1. **Group delete button** - Delete group button in group header
2. **Model delete button** - Delete model button in model header
3. **Model remove from group** - Remove × button in group model list

All three now work correctly without toggling the panel.

## Testing

✅ **Delete Standalone Model**

1. Click × on standalone model
2. Confirm deletion
3. Model is deleted ✅ (not toggled)

✅ **Remove Model from Group**

1. Click × next to model name in group
2. Confirm deletion
3. Model removed from list ✅ (not toggled)

✅ **Delete Group**

1. Click "Delete" button on group header
2. Confirm deletion
3. Group is deleted ✅ (not toggled)

## Code Quality

✅ Syntax: VALID (node -c)
✅ Linting: CLEAN
✅ Formatting: APPLIED
✅ No breaking changes
✅ Backward compatible

## Impact

- **Scope:** Minimal (2 lines added)
- **Risk:** Very low (just adds event control)
- **Performance:** Neutral (stopPropagation is efficient)
- **User experience:** ✅ Better (buttons now work as expected)

## Related

This is part of the larger Presets system fixes:

- See PRESETS_LOGIC_FIX.md for group logic
- See PRESETS_MODEL_LOADING_FIX.md for model loading
- See PRESETS_FINAL_SUMMARY.md for overview
