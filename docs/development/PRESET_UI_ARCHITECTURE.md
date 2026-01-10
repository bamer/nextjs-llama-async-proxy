# Preset UI Visual Flow & Architecture

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Preset Management UI                     │
│                                                          │
│  1. User lands on /presets page                       │
│     ↓                                                   │
│  2. Sees list of available presets                      │
│     ↓                                                   │
│  3. Selects a preset (or clicks "Create New")            │
│     ↓                                                   │
│  4. Sees hierarchical view:                              │
│     ┌────────────────────────────────────────┐                │
│     │  ⭐ Global Defaults                │                │
│     │    - Context: 2048                   │                │
│     │    - Temp: 0.7                       │                │
│     │    - GPU Layers: 0                     │                │
│     │                                      │                │
│     │  📦 Group: gpu-models                 │                │
│     │    - Context: 4096*                  │                │
│     │    ├─ Model: qwen-7b                  │                │
│     │    │  - Path: ...qwen.gguf*      │                │
│     │    │  - Temp: 0.6*                    │                │
│     │    │  - GPU Layers: 35*                │                │
│     │    │                                  │                │
│     │    └─ Model: mistral-7b                │                │
│     │                                      │                │
│     │  [+ Add Model] [+ Add Group]            │                │
│     └────────────────────────────────────────┘                │
│                                                          │
│  5. User clicks "Edit" on any element                    │
│     ↓                                                   │
│  6. Modal opens with form                                │
│     ↓                                                   │
│  7. User modifies parameters (live validation)              │
│     ↓                                                   │
│  8. User clicks "Save"                                   │
│     ↓                                                   │
│  9. Backend updates .ini file                             │
│     ↓                                                   │
│ 10. UI refreshes to show changes                         │
│     ↓                                                   │
│ 11. Success notification shows                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
PresetsController
    │
    ├─ PresetsPage (Main container)
    │   │
    │   ├─ PresetList (Sidebar)
    │   │   ├─ PresetCard (list item)
    │   │   └─ AddPresetButton
    │   │
    │   ├─ HierarchyView (Middle panel)
    │   │   ├─ GlobalDefaultsSection
    │   │   │   ├─ GlobalParameterSummary
    │   │   │   └─ EditGlobalDefaultsButton
    │   │   │
    │   │   ├─ GroupList
    │   │   │   ├─ GroupCard
    │   │   │   │   ├─ GroupHeader
    │   │   │   │   ├─ GroupParameterSummary
    │   │   │   │   ├─ ModelList
    │   │   │   │   │   └─ ModelCard
    │   │   │   │   │       ├─ ModelHeader
    │   │   │   │   │       ├─ ModelPathDisplay
    │   │   │   │   │       └─ ModelParameterSummary
    │   │   │   │   └─ GroupActions (Edit/Delete/Duplicate)
    │   │   │   └─ AddGroupButton
    │   │   │
    │   │   └─ AddModelButton (in each group)
    │   │
    │   └─ ParameterEditor (Right panel, optional)
    │       ├─ ParameterForm
    │       ├─ ValidationMessages
    │       └─ ActionButtons (Save/Cancel/Reset)
    │
    ├─ Modals
    │   ├─ GlobalDefaultsModal
    │   ├─ GroupModal
    │   ├─ ModelModal
    │   ├─ InheritanceViewerModal
    │   ├─ PresetTemplateModal
    │   └─ ConfirmDeleteModal
    │
    └─ Notifications
        └─ ToastNotification
```

## Data Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Load Presets
       │    socket.emit('presets:list')
       │
       ▼
┌─────────────────────┐
│  Server Handler    │
│  (presets.js)     │
└──────┬────────────┘
       │
       │ 2. Read Files
       │    fs.readdirSync(config/)
       │
       ▼
┌─────────────────────┐
│  File System      │
│  /config/*.ini   │
└──────┬────────────┘
       │
       │ 3. Parse INI
       │    parseIni(content)
       │
       ▼
┌─────────────────────┐
│  Preset Object   │
│  {               │
│    [*]: {...},    │
│    [group]: {...},│
│    [model]: {...} │
│  }               │
└──────┬────────────┘
       │
       │ 4. Calculate Inheritance
       │    merge(*, group, model)
       │
       ▼
┌─────────────────────┐
│  Config Data      │
│  for UI          │
└──────┬────────────┘
       │
       │ 5. Send to Client
       │    socket.emit(response)
       │
       ▼
┌─────────────────────┐
│  PresetsController│
│  update state    │
└──────┬────────────┘
       │
       │ 6. Render UI
       │    setState({ presets })
       │
       ▼
┌─────────────────────┐
│  UI Components   │
│  (DOM updates)   │
└─────────────────┘
```

## State Management

### Initial State

```javascript
state = {
  presets: [], // Array of preset files
  selectedPreset: null, // Currently selected preset
  globalDefaults: null, // Global defaults from [*]
  groups: [], // Array of group objects
  editing: {
    type: null, // 'global', 'group', 'model'
    item: null, // The item being edited
    tempValues: {}, // Temporary values before save
  },
  loading: false,
  error: null,
  validation: {
    errors: {},
    warnings: {},
  },
};
```

### Group Object Structure

```javascript
{
  name: 'gpu-models',
  description: 'Models optimized for GPU',
  parameters: {
    ctxSize: 4096,
    temp: 0.8,
    nGpuLayers: 35
  },
  models: [
    {
      name: 'qwen-7b',
      path: '/models/qwen-7b.gguf',
      parameters: {
        temp: 0.6,
        nGpuLayers: 40
      }
    }
  ]
}
```

### Merged Configuration (for a model)

```javascript
{
  source: 'model',        // Where this came from
  merged: {              // Final values used
    ctxSize: 4096,       // From group
    temp: 0.6,          // From model (override)
    nGpuLayers: 40,     // From model (override)
    threads: 0,          // From global (no override)
    batch: 512          // From global (no override)
  },
  sources: {              // Trace each value
    ctxSize: 'group',
    temp: 'model',
    nGpuLayers: 'model',
    threads: 'global',
    batch: 'global'
  }
}
```

## Modal Flow

### Global Defaults Modal

```
Open
  │
  ├─ Load current defaults from state
  │
  ├─ Populate form with values
  │
  ├─ User edits (validate on change)
  │
  ├─ Show validation errors/warnings
  │
  └─ Actions:
      ├─ Cancel → Close without saving
      ├─ Reset → Restore to llama.cpp defaults
      └─ Save → Call handleSaveDefaults()
              → Emit 'presets:update-defaults'
              → Refresh state
              → Show notification
              → Close modal
```

### Group Modal

```
Open (Create)
  │
  ├─ Initialize empty form
  │
  ├─ User enters name (validate unique)
  │
  ├─ Select parameters to override
  │
  └─ Save → Create group in INI

Open (Edit)
  │
  ├─ Load existing group data
  │
  ├─ Populate form with current values
  │
  ├─ User edits
  │
  └─ Save → Update group in INI
```

### Model Modal

```
Open (Create)
  │
  ├─ Load available models list
  │
  ├─ User selects model from dropdown
  │     OR
  ├─ User browses for model path
  │
  ├─ Show inherited parameters (gray)
  │
  ├─ User selects overrides (click to enable)
  │
  └─ Save → Add model to INI

Open (Edit)
  │
  ├─ Load existing model data
  │
  ├─ Show current values (green=override, gray=inherited)
  │
  ├─ User edits
  │
  └─ Save → Update model in INI
```

## Validation Flow

```
User Input
  │
  ▼
┌─────────────────┐
│ Debounce 300ms │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│ Validate Parameter   │
│ - Type check        │
│ - Range check       │
│ - Required fields    │
└──────┬──────────────┘
       │
       ▼
  Valid?
  │
  ├─ Yes → Show green checkmark
  │
  └─ No  → Show error message
              ├─ Fix suggestion
              └─ Disable Save button
```

## Error Handling

```
Error Occurs
  │
  ▼
┌────────────────────┐
│ Catch Error      │
└────┬───────────┘
     │
     ▼
┌────────────────────┐
│ Classify Error   │
│ - Validation     │
│ - File I/O      │
│ - Network       │
│ - Unknown       │
└────┬───────────┘
     │
     ▼
┌────────────────────┐
│ User Message    │
│ - Friendly text │
│ - Action to fix │
│ - Retry option  │
└────┬───────────┘
     │
     ▼
┌────────────────────┐
│ Log Details     │
│ - Error code    │
│ - Stack trace   │
│ - Context      │
└────┬───────────┘
     │
     ▼
┌────────────────────┐
│ Show Toast      │
│ - Error icon    │
│ - Message      │
│ - Auto-dismiss │
└────────────────────┘
```

## Responsive Breakpoints

```
Desktop (>1200px)
┌─────────┬──────────────┬──────────────────┐
│ Presets │ Hierarchy   │ Parameter Editor │
│ List   │ Tree        │ (if selected)   │
├─────────┼──────────────┼──────────────────┤
│         │             │                  │
│ Sidebar │ Middle      │ Right panel      │
│         │             │                  │
└─────────┴──────────────┴──────────────────┘

Tablet (768px - 1200px)
┌──────────────┬──────────────────┐
│ Presets List  │ Hierarchy Tree  │
│              │ & Parameter     │
│              │ Editor (toggle)  │
├──────────────┼──────────────────┤
│              │                  │
│ Sidebar      │ Main content     │
│              │                  │
└──────────────┴──────────────────┘

Mobile (<768px)
┌──────────────────────────────────┐
│  [☰] Presets     [+ New]   │
├──────────────────────────────────┤
│                                │
│  Hierarchy Tree               │
│  (expand to edit)              │
│                                │
│  [+ Add Model/Group]           │
│                                │
│  Parameter Editor              │
│  (modal on tap)               │
│                                │
└──────────────────────────────────┘
```

## Color System

### Inheritance Indicators

```css
/* Global inherited */
.inherited-global {
  color: #9ca3af; /* Gray-400 */
  border-left: 3px solid #d1d5db;
}

/* Group inherited */
.inherited-group {
  color: #f59e0b; /* Amber-500 */
  border-left: 3px solid #fbbf24;
}

/* Model override */
.override-model {
  color: #10b981; /* Emerald-500 */
  border-left: 3px solid #34d399;
}

/* Modified (unsaved) */
.modified {
  color: #ef4444; /* Red-500 */
  border-left: 3px solid #f87171;
}
```

### Validation States

```css
/* Valid */
.valid {
  border-color: #10b981;
}

/* Warning */
.warning {
  border-color: #f59e0b;
  background: #fffbeb;
}

/* Error */
.invalid {
  border-color: #ef4444;
  background: #fef2f2;
}
```

## Keyboard Shortcuts

```
Ctrl/Cmd + N    → New Preset
Ctrl/Cmd + S    → Save (when editing)
Ctrl/Cmd + D    → Duplicate selected
Delete          → Delete selected
Escape          → Close modal
Ctrl/Cmd + F    → Find/Search
Arrow Up/Down   → Navigate tree
Enter           → Edit selected
```

## Accessibility

### ARIA Labels

- All buttons have descriptive labels
- Tree navigation uses `role="tree"`
- Modals use `role="dialog"`
- Forms use proper labels and descriptions

### Keyboard Navigation

- Full keyboard support
- Focus management in modals
- Escape key closes modals
- Tab order follows visual layout

### Screen Reader

- Announce changes to live region
- Read parameter values with units
- Announce validation errors
- Describe inheritance sources

## Performance Optimizations

### Rendering

```
1. Debounce state updates (300ms)
2. Only re-render changed components
3. Use requestAnimationFrame for animations
4. Lazy load large preset lists
5. Virtual scroll for 100+ models
```

### Data Fetching

```
1. Cache preset data in memory
2. Debounce API calls
3. Batch multiple changes
4. Use WebSocket for real-time updates
5. Abort stale requests
```

### Memory Management

```
1. Clean up event listeners
2. Dispose unused components
3. Limit history size
4. Clear temporary forms
5. Remove closed modals from DOM
```
