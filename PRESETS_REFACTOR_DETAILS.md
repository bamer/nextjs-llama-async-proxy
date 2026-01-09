# Presets Refactor - Code Details

## Core Issue Fixed

**Before:** Groups rendered individual models with full parameter editing
```javascript
// OLD CODE
renderGroupSection(group) {
  // ... group header ...
  return Component.h(
    "div",
    { className: "group-section" },
    // PROBLEM: Rendered full param list for group
    this.renderReadOnlyParams(group, "group", group.name),
    // PROBLEM: Then rendered EACH MODEL with THEIR params too
    group.models.map((model) => this.renderModelSection(model, group.name)),
    // Group becomes cluttered and confusing
  );
}
```

**After:** Groups show only model names, parameters separate
```javascript
// NEW CODE
renderGroupSection(group) {
  // ... group header ...
  return Component.h(
    "div",
    { className: "group-section" },
    // CLEAR: Models section with just names
    Component.h("div", { className: "group-models-section" },
      Component.h("h4", {}, "Applies to"),
      group.models.map((model) =>
        Component.h("div", { className: "model-list-item" },
          Component.h("span", {}, model.name),
          Component.h("button", { "data-action": "delete-model" }, "×")
        )
      ),
      Component.h("button", { "data-action": "new-model" }, "+ Add Model")
    ),
    // CLEAR: Parameters section
    Component.h("div", { className: "group-params-section" },
      Component.h("h4", {}, "Group Parameters"),
      this.renderEditableParams(group, "group", group.name)
    )
  );
}
```

---

## renderModelSection() Simplification

**Before:** Had to handle both group and standalone modes
```javascript
// OLD: Complex with group-specific handling
renderModelSection(model, groupName = null) {
  const isInGroup = groupName !== null;
  const isEditing = !isInGroup && this.state.editingModel === fullName;
  
  // Show group-member notice if in group
  return isInGroup
    ? Component.h("div", {}, "This model inherits from group...")
    : Component.h("div", {}, isEditing ? renderEditableParams(...) : renderReadOnlyParams(...));
}
```

**After:** Simple - only handles standalone
```javascript
// NEW: Only for standalone models
renderModelSection(model, groupName = null) {
  // Guard: should never be called with groupName
  const isEditing = groupName === null && this.state.editingModel === fullName;
  
  return Component.h(
    "div",
    {},
    // Expand to show/edit parameters
    isEditing
      ? this.renderEditableParams(model, "model", fullName)
      : this.renderReadOnlyParams(model, "model", fullName)
  );
}
```

---

## New UI Sections

### Group Models Section
**HTML Structure:**
```html
<div class="group-models-section">
  <h4 class="subsection-title">Applies to</h4>
  <div class="models-list-compact">
    <div class="model-list-item">
      <span class="model-name">llama2-7b</span>
      <button class="btn-remove-model" data-action="delete-model">×</button>
    </div>
    <!-- More models... -->
  </div>
  <button class="btn btn-secondary" data-action="new-model">+ Add Model</button>
</div>
```

**CSS Classes:**
- `.group-models-section` - Container with border and padding
- `.models-list-compact` - Flex column for items
- `.model-list-item` - Horizontal flex: name + remove button
- `.btn-remove-model` - Styled red X button
- `.subsection-title` - "Applies to" label

### Group Parameters Section
**HTML Structure:**
```html
<div class="group-params-section">
  <h4 class="subsection-title">Group Parameters</h4>
  <!-- Renders editable/readonly params here -->
</div>
```

**CSS Classes:**
- `.group-params-section` - Container with border and padding
- `.subsection-title` - "Group Parameters" label

---

## Validation and Safety

Added check in `handleStartEdit()` to prevent editing group models:
```javascript
// Prevent editing models in groups - they're read-only
if (section === "model" && name?.includes("/")) {
  const msg =
    "Models in groups inherit group parameters. " +
    "Edit the group or move the model to standalone.";
  showNotification(msg, "info");
  return;
}
```

This prevents accidental editing if someone tries to click a parameter value in a group member.

---

## Data Model (Unchanged)

The backend data structure remains the same:

**Group Entry:**
```javascript
{
  name: "high-perf",
  ctxSize: 4096,
  temperature: 0.7,
  nGpuLayers: 35,
  models: [
    { name: "llama2-7b", model: "/path/to/model.gguf" },
    { name: "mistral-7b", model: "/path/to/model.gguf" }
  ]
}
```

**Standalone Entry:**
```javascript
{
  name: "my-custom-model",
  ctxSize: 2048,
  temperature: 0.5,
  model: "/path/to/model.gguf"
}
```

---

## Event Handling

Same event handlers, just fewer calls:

| Event | Handler | Old Behavior | New Behavior |
|-------|---------|--------------|--------------|
| `delete-model` | `handleDeleteModel()` | Remove from group OR delete standalone | Remove from group OR delete standalone |
| `new-model` | `handleNewModel()` | Add to group OR add standalone | Add to group OR add standalone |
| `toggle-group` | `handleToggleGroup()` | Expand group (showing all models) | Expand group (showing model list + params) |
| `start-edit` | `handleStartEdit()` | Allow edit anywhere | Block edit if in group path |
| `save-edit` | `handleSaveEdit()` | Same | Same |

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Visual Clarity** | Nested, cluttered | Clean, hierarchical |
| **User Intent** | Ambiguous | Clear |
| **Model Count** | Variables per group | Visible in badge |
| **Parameter Editing** | Can edit in group (wrong!) | Only editable in standalone |
| **Model Removal** | Hidden in full expansion | Inline [×] button |
| **Code Complexity** | High (group + model rendering) | Low (simple list) |
| **Test Coverage** | Complex scenarios | Simpler scenarios |

---

## Files Changed

```
public/js/pages/presets.js (Main logic)
├─ renderGroupSection() - Complete redesign
├─ renderModelSection() - Simplified
├─ handleStartEdit() - Added guard
└─ Linting fixes

public/css/pages/presets/presets.css (Styling)
├─ .group-models-section (NEW)
├─ .models-list-compact (NEW)
├─ .model-list-item (NEW)
├─ .btn-remove-model (NEW)
└─ .group-params-section (NEW)
```

---

## Testing Priority

1. **Critical:** Add model to group, verify it appears in list
2. **Critical:** Remove model from group via [×], verify it's gone
3. **Critical:** Edit group parameters, verify models inherit them
4. **High:** Add standalone model, edit its parameters
5. **High:** Try to edit model parameter in group (should show message)
6. **Medium:** Add/remove multiple models in same group
7. **Medium:** Verify CSS styling matches rest of app

