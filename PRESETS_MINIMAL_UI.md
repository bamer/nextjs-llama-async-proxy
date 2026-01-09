# Presets Minimal Parameter UI

## Update: Minimal-First Approach

Refactored presets to show **only explicitly-set parameters**. This is a clean, minimal-first UI where:

- Only parameters the user explicitly adds are shown
- Global defaults "\*" starts empty - user adds overrides as needed
- Groups start empty - user adds parameters one-by-one
- Standalone models start empty - user adds parameters one-by-one

---

## Key Changes

### 1. Global Defaults (\*) - Minimal Empty Start

**Before:**

- Global defaults always showed all parameters
- Could be confusing for new users

**After:**

- Starts completely empty
- User clicks "Add Parameter" dropdown
- Selects parameters they want to override from llama-server defaults
- Only those parameters appear in the UI
- Each parameter has a × button to remove it

**Result**: Clean, uncluttered interface focused on overrides only

---

### 2. Groups - Minimal Start

When creating a new group:

1. Group created with empty parameters
2. Auto-expands and enters edit mode
3. User sees "Add Parameter" dropdown
4. Selects parameters to add → appear in list with default values
5. Can add as many as needed
6. Each has × button to remove
7. Click "Save"

**Benefits**:

- Only overrides visible
- No clutter from unused parameters
- Clear focus on what needs configuration

---

### 3. Standalone Models - Minimal Start

Exact same flow as groups - starts empty, user adds parameters one-by-one.

---

### 4. Updated `renderEditableParams()`

```javascript
// Get only parameters explicitly set by user
const setParams = PRESET_PARAMS.filter((param) => data[param.iniKey] !== undefined);

// Get parameters available to add
const availableToAdd = PRESET_PARAMS.filter((param) => data[param.iniKey] === undefined);

// Show only set parameters (minimal UI)
const paramsToShow = setParams;
```

**Logic**:

- `paramsToShow`: Only parameters with values (shows in list)
- `availableToAdd`: Dropdown shows only parameters not yet added
- Remove buttons: Always available for all sections
- Add dropdown: Always available if parameters left to add

---

## UI Flow Examples

### Global Defaults - Add Context Size Override

```
1. Click "Global Defaults (*)" to expand
2. See empty list with "Add Parameter" dropdown
3. Select "Context Size" from dropdown
4. Parameter appears with input field (default value: 2048)
5. Edit value to custom amount
6. Click "Save"
```

### New Group - Configure for 70B Models

```
1. Click "+ Add Group"
2. Enter "llama-70b" → Group created & expanded
3. See "Add Parameter" dropdown (empty list below)
4. Add "GPU Layers" (for quantization)
5. Add "Context Size" (override default)
6. Add "Temperature" (sampling override)
7. Configure each parameter
8. Click "Save"
```

### New Standalone Model - Minimal Setup

```
1. Click "+ Add Standalone Model"
2. Select model file and name → Model auto-expanded
3. See "Add Parameter" dropdown
4. Add only "GPU Layers"
5. Set to 35 (for this specific model)
6. Click "Save"
```

---

## Architecture

### Parameter Selection Algorithm

```javascript
PRESET_PARAMS = [
  { key: "ctx-size", iniKey: "ctxSize", label: "Context Size", ... },
  { key: "temp", iniKey: "temperature", label: "Temperature", ... },
  // ... 6 parameters total
]

User Data Examples:
- {} = empty (no overrides)
- { ctxSize: 4096 } = 1 override
- { ctxSize: 4096, temperature: 0.9, nGpuLayers: 35 } = 3 overrides
```

### Dropdown Logic

```javascript
// Available to add = not in current data
availableToAdd = PRESET_PARAMS.filter((p) => data[p.iniKey] === undefined);

// Example: if data has { ctxSize: 4096 }
// availableToAdd shows all 5 other parameters
// Dropdown updates as user adds parameters
```

---

## Removed Complexity

- ❌ No more "show all parameters in view mode"
- ❌ No more "edit/view toggle confusion"
- ❌ No more "inherited parameter display"
- ✅ Simple: Add, Edit, Remove, Save

---

## Benefits

1. **Minimal UI**: Only see what you're overriding
2. **Focus**: Clear intent - configuration, not information dump
3. **Consistency**: All sections (defaults, groups, models) same pattern
4. **User-Friendly**: Progressive disclosure - add only what's needed
5. **Clear Feedback**: Dropdown always shows available options
6. **Reversible**: × button to remove parameters anytime

---

## Testing Scenarios

- [ ] Empty global defaults - verify no parameters shown
- [ ] Add parameter to defaults - verify dropdown shows available
- [ ] Remove parameter from defaults - verify × button works
- [ ] Create group with no parameters - verify empty
- [ ] Add multiple parameters to group - verify each appears
- [ ] Create standalone model - verify empty start
- [ ] Add parameter to standalone - verify edit and save
- [ ] Verify parameters persist after reload

---

## Code Changes

### File: `public/js/pages/presets.js`

1. **`renderDefaultsSection()`**
   - Simplified: removed `isEditing` flag
   - Always shows editable params (empty to start)
   - Updated label to "Global Defaults (\*)"

2. **`renderEditableParams()`**
   - Changed: Always show only `setParams` (not `PRESET_PARAMS`)
   - All sections now minimal (defaults, groups, models)
   - Dropdown available for all sections

3. **Action Buttons**
   - Consistent "Save" button across all sections
   - "Cancel" button only for groups/models
   - Removed "Save Defaults" special case

4. **Remove Buttons**
   - Now show for all sections
   - Users can remove any parameter anytime
