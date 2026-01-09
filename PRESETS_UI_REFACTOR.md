# Presets Page UI Refactor

## Summary

Refactored the presets page to provide a cleaner, more user-friendly parameter management experience:

1. **Global Defaults ("*")**: Always in edit mode - no toggle between view/edit
2. **Groups & Standalone Models**: Start with empty parameters - users add params one-by-one
3. **Parameter Management**: Simple dropdown to add parameters, × button to remove

## Changes Made

### 1. Global Defaults Section - Always Edit Mode

**File**: `public/js/pages/presets.js`

Changed `renderDefaultsSection()` to always display editable parameters instead of toggling between read-only and edit modes.

```javascript
// Before: isEditing ? renderEditableParams() : renderReadOnlyParams()
// After: renderEditableParams() always shown
```

**Benefits**:
- No confusion about edit/view modes
- Direct access to parameters
- Simpler UI for frequently-used defaults

---

### 2. Groups - Direct Editing Interface

When creating a new group:
- Auto-expands the group section
- Automatically enters editing mode with empty parameters
- User immediately sees "Add Parameter" dropdown

```javascript
handleNewGroup() {
  // ... create group
  this.setState({
    expandedGroups: { ...this.state.expandedGroups, [groupName]: true },
    editingGroup: groupName,
    editingData: {}, // Start with empty parameters
  });
}
```

Groups always show the editable parameter interface (no read-only view).

---

### 3. Standalone Models - Direct Editing Interface

When creating a new standalone model:
- Auto-expands the model section
- Automatically enters editing mode with empty parameters
- User immediately sees "Add Parameter" dropdown

```javascript
async createModel(name, groupName, fullName, modelPath) {
  // ... create model
  this.setState({
    expandedModels: { ...this.state.expandedModels, [fullKey]: true },
    ...(groupName === "" && {
      editingModel: fullKey,
      editingData: {}, // Start with empty parameters
    }),
  });
}
```

Only standalone models (not models in groups) can be edited directly.

---

### 4. Parameter Management - One-by-One Addition

#### New Method: `handleAddParam()`

```javascript
handleAddParam(e) {
  const select = e.target.closest("[data-action=add-param-select]");
  if (!select || !select.value) return;
  
  const paramKey = select.value;
  const param = PRESET_PARAMS.find((p) => p.key === paramKey);
  
  // Add parameter with default value
  const newData = { ...this.state.editingData };
  newData[param.iniKey] = param.default;
  
  this.setState({ editingData: newData });
  // Reset select for next addition
  setTimeout(() => { select.value = ""; }, 0);
}
```

#### New Method: `handleRemoveParam()`

```javascript
handleRemoveParam(e) {
  const btn = e.target.closest("[data-action=remove-param]");
  if (!btn) return;
  
  const paramKey = btn.dataset.param;
  const param = PRESET_PARAMS.find((p) => p.key === paramKey);
  
  // Remove parameter from editing data
  const newData = { ...this.state.editingData };
  delete newData[param.iniKey];
  
  this.setState({ editingData: newData });
}
```

---

### 5. Updated `renderEditableParams()`

Smart parameter rendering based on section type:

#### For Global Defaults ("*"):
- Shows ALL parameters
- No remove buttons (can't remove defaults)
- Only "Save Defaults" button

#### For Groups & Standalone Models:
- Shows only parameters that are explicitly set
- Add remaining parameters via dropdown
- × button to remove each parameter
- "Save" and "Cancel" buttons

```javascript
renderEditableParams(data, sectionType, sectionName = null) {
  const setParams = PRESET_PARAMS.filter(p => data[p.iniKey] !== undefined);
  const availableToAdd = PRESET_PARAMS.filter(p => data[p.iniKey] === undefined);
  const isDefaults = sectionType === "defaults";
  const paramsToShow = isDefaults ? PRESET_PARAMS : setParams;

  // Render current parameters with optional remove buttons
  // Render "Add Parameter" dropdown for non-defaults sections
  // Show appropriate action buttons
}
```

---

### 6. UI Flow

#### Creating a New Group:

1. User clicks "+ Add Group"
2. Enters group name → group created with `_is_group` flag
3. Group auto-expands
4. "Add Parameter" dropdown appears
5. User selects parameter → added with default value
6. Repeat for additional parameters
7. Click "Save" to persist

#### Creating a Standalone Model:

1. User clicks "+ Add Standalone Model"
2. Selects model file and name → model created
3. Model auto-expands
4. "Add Parameter" dropdown appears
5. User selects parameter → added with default value
6. Repeat for additional parameters
7. Click "Save" to persist

#### Editing Global Defaults:

1. Open "Global Defaults" section (always expanded by default)
2. See all parameters with their current values
3. Modify values directly
4. Click "Save Defaults"

---

## Event Handlers Added

```javascript
getEventMap() {
  return {
    // ... existing handlers
    "change [data-action=add-param-select]": "handleAddParam",
    "click [data-action=remove-param]": "handleRemoveParam",
  };
}
```

---

## Benefits

✅ **Cleaner UX**: No confusing edit/view mode toggles
✅ **Simpler Onboarding**: New users immediately see what to do
✅ **Explicit Control**: Add only the parameters you need
✅ **Flexible**: Easy to add/remove parameters at any time
✅ **Consistent**: All sections follow same pattern
✅ **Accessible**: Clear visual feedback for all actions

---

## Testing Checklist

- [ ] Create new group - verify auto-expand and edit mode
- [ ] Add parameter to group - verify dropdown and add functionality
- [ ] Remove parameter from group - verify × button works
- [ ] Create standalone model - verify auto-expand and edit mode
- [ ] Add multiple parameters - verify each can be added
- [ ] Save group/model - verify parameters persist
- [ ] Edit global defaults - verify always in edit mode
- [ ] Save defaults - verify changes apply to "*" entry
