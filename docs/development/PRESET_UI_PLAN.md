# Preset UI Implementation Plan

## Overview

Complete the preset management UI for llama.cpp router mode .ini configuration with hierarchical inheritance support.

## Architecture

- **Global Defaults `[*]`**: Default parameters applied to all models
- **Groups `[group-name]`**: Shared settings for multiple models
- **Models `[group-name/model-name]`**: Per-model overrides
- **Inheritance Chain**: Global → Group → Model (most specific wins)

---

## Phase 1: Core Functionality (MVP)

**Goal**: Make all basic CRUD operations work

### 1.1 Global Defaults Editor

- [ ] Fix `handleSaveDefaults()` to actually save to backend
- [ ] Add validation before saving (numeric ranges, required fields)
- [ ] Add "Reset to Default" button
- [ ] Show which models inherit from global

### 1.2 Group Management

- [ ] Implement `handleSaveGroup()` to create/update groups
- [ ] Add "Duplicate Group" functionality
- [ ] Add group description field
- [ ] Validate group names (no special chars, no duplicates)
- [ ] Show which models belong to each group

### 1.3 Model Management

- [ ] Implement `handleSaveModel()` to create/update models
- [ ] Model path selector (browse file system or dropdown of detected models)
- [ ] Auto-detect models from configured models directory
- [ ] Add "Duplicate Model" functionality
- [ ] Validate model names within groups

### 1.4 Delete Operations

- [ ] Implement `handleDeleteGroup()` with confirmation
- [ ] Implement `handleDeleteModel()` with confirmation
- [ ] Handle cascading deletes (deleting group → what happens to models?)

---

## Phase 2: Enhanced UX

**Goal**: Make the interface intuitive and helpful

### 2.1 Inheritance Visualization

- [ ] Color-coded values to show inheritance source:
  - Green: Model-specific override
  - Yellow: Group override
  - Gray: Global default
- [ ] Click any value to see its source (tooltip)
- [ ] "View Full Config" modal showing merged final config

### 2.2 Parameter Form Improvements

- [ ] Expand to support all llama.cpp router parameters:
  - Context checkpoints, split-mode, tensor-split
  - Main GPU, MMP, cache-ram
  - Samplers, mirostat settings
  - Speculative decoding parameters
- [ ] Group parameters logically:
  - Model Settings (path, context, GPU layers)
  - Performance (threads, batch, ubatch)
  - Sampling (temp, top-p, top-k, penalties)
  - Advanced (tensor-split, split-mode, etc.)
- [ ] Add tooltips with parameter descriptions
- [ ] Smart defaults based on model size/type

### 2.3 Smart Features

- [ ] "Create from Existing Model" button (copies settings)
- [ ] Preset templates (small models, large models, GPU-heavy, CPU-only)
- [ ] Quick actions:
  - "Apply to All Models in Group"
  - "Copy Settings to Another Model"
  - "Reset to Global Defaults"
- [ ] Batch operations (select multiple models)

### 2.4 Real-time Validation

- [ ] Live validation as user types (not just on save)
- [ ] Show warnings for:
  - Conflicting GPU layers across groups
  - Context size too large for VRAM
  - Invalid parameter combinations
- [ ] Estimated VRAM usage calculator
- [ ] Warning before potentially breaking changes

---

## Phase 3: Visual Polish

**Goal**: Modern, responsive, friendly UI

### 3.1 Layout Improvements

- [ ] Three-panel layout:
  - Left: Preset list
  - Middle: Hierarchical tree (Global → Groups → Models)
  - Right: Parameter editor
- [ ] Collapsible sections (accordion style)
- [ ] Responsive design:
  - Desktop: Three panels
  - Tablet: Two panels (tree + editor)
  - Mobile: Single panel with tabs

### 3.2 Enhanced Cards

- [ ] Visual indicators:
  - Badges for active presets
  - Status icons for model loading state
  - Modified indicators (unsaved changes)
- [ ] Expandable cards for quick overview
- [ ] Drag-and-drop to reorder models within groups
- [ ] Search/filter within groups

### 3.3 Color Scheme & Theming

- [ ] Dark mode support
- [ ] Consistent with existing dashboard theme
- [ ] Color-coded parameter categories
- [ ] Smooth transitions and animations

### 3.4 Empty States & Onboarding

- [ ] Helpful empty states with call-to-actions
- [ ] "Quick Start" guide for new users
- [ ] Example preset that can be loaded
- [ ] Inline tips for first-time setup

---

## Phase 4: Advanced Features

**Goal**: Power user features

### 4.1 Preset Management

- [ ] Import/Export presets (download .ini files)
- [ ] Share presets to clipboard
- [ ] Preset library (community presets)
- [ ] Version history (undo/redo)
- [ ] Preset comparison tool

### 4.2 Integration with Models Page

- [ ] Auto-detect models and suggest preset creation
- [ ] Link from models page to presets
- [ ] Apply preset to running model
- [ ] See which preset a running model is using

### 4.3 Advanced Parameters

- [ ] Custom parameters (user-defined key-value pairs)
- [ ] Environment variable support
- [ ] Conditional parameters (if model size > X, then Y)
- [ ] Parameter presets (load a set of parameters at once)

### 4.4 Testing & Validation

- [ ] "Test Configuration" button (dry-run)
- [ ] Show estimated VRAM usage per model
- [ ] Validate with llama.cpp binary
- [ ] Error diagnostics with suggestions

---

## Implementation Details

### File Structure (keep files < 200 lines)

```
public/js/pages/
  ├── presets.js (Controller, already exists)
  ├── presets/
  │   ├── global-editor.js         # Global defaults editor
  │   ├── group-editor.js          # Group CRUD
  │   ├── model-editor.js          # Model CRUD
  │   ├── inheritance-viewer.js    # Show inheritance chain
  │   ├── parameter-form.js         # Reusable form component
  │   └── validator.js            # Validation logic

public/js/components/
  └── presets/
      ├── preset-card.js            # Preset list item
      ├── group-card.js            # Group card
      ├── model-card.js            # Model card
      ├── param-input.js           # Parameter input with validation
      ├── inheritance-badge.js       # Shows inheritance source
      └── tree-view.js            # Hierarchical navigation

public/css/pages/
  └── presets/
      ├── presets.css              # Main styles
      ├── editor.css              # Parameter editor
      ├── tree.css                # Navigation tree
      └── modals.css            # Modal styles
```

### Component Responsibilities

#### GlobalEditor

- Display global defaults section
- Edit/save/revert functionality
- Reset to llama.cpp defaults
- Show which models use global defaults

#### GroupEditor

- Create/edit/delete groups
- Add/remove models to groups
- Set group-level parameters
- Duplicate group functionality

#### ModelEditor

- Create/edit/delete models
- Select model from detected list
- Set model-specific parameters
- Override inheritance from group/global

#### InheritanceViewer

- Visual representation of inheritance chain
- Color-coded values (green=override, gray=inherit)
- Click to trace value source
- "View Merged Config" modal

#### ParameterForm

- Reusable form for all parameter types
- Validation per parameter
- Tooltips with descriptions
- Smart defaults based on context

---

## Backend Enhancements

### New API Events

```javascript
// Get available models for dropdown
socket.on("presets:available-models", async (data, ack) => {
  const models = detectModelsInDirectory();
  ack({ success: true, data: { models } });
});

// Validate configuration before saving
socket.on("presets:validate-config", async (data, ack) => {
  const result = validateFullConfig(data.filename);
  ack({ success: true, data: result });
});

// Get inheritance info for a model
socket.on("presets:get-inheritance", async (data, ack) => {
  const chain = getInheritanceChain(data.filename, data.modelName);
  ack({ success: true, data: { chain } });
});

// Duplicate configuration
socket.on("presets:duplicate-model", async (data, ack) => {
  const result = duplicateModelConfig(data.filename, data.source, data.target);
  ack({ success: true, data: result });
});

// Import from existing model
socket.on("presets:import-from-model", async (data, ack) => {
  const config = importFromRunningModel(data.modelId);
  ack({ success: true, data: { config } });
});
```

### Enhanced Validation

- Numeric range validation
- Enum value validation (e.g., split-mode values)
- VRAM estimation
- Parameter dependency validation
- Cross-model conflict detection

---

## UI Design Mockups

### Main Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  Preset Management                    [+ New Preset] [⚙]   │
├──────────┬──────────────────────┬────────────────────────────┤
│ Presets  │  Hierarchy Tree    │  Parameter Editor        │
│          │                    │                         │
│ ● default│  ⭐ Global          │  Model Settings        │
│ ○ dev    │    ├─ ctx-size     │  ┌────────────────┐   │
│ ○ prod   │    ├─ temp         │  │ Model Path     │   │
│          │                    │  │ [browse...]    │   │
│ [+ Add]  │  📦 gpu-models     │  │ Context Size  │   │
│          │    ├─ ctx-size*   │  │ [4096]       │   │
│          │    ├─ temp*        │  └────────────────┘   │
│          │    │               │  Performance           │
│          │    ├─ qwen-7b     │  ┌────────────────┐   │
│          │    │  └─ ctx-size*│  │ Threads       │   │
│          │    │               │  │ [8]           │   │
│          │    └─ mistral-7b  │  └────────────────┘   │
│          │                    │                         │
│          │  [+] Add Model     │  📊 VRAM Usage: 8GB │
│          │                    │                         │
│          │  [+] Add Group     │  [Cancel] [Save]       │
└──────────┴──────────────────────┴────────────────────────────┘

* = Override (yellow badge)
  = Local override (green badge)
  = Inherited (gray, no badge)
```

### Parameter Editor Modal

```
┌────────────────────────────────────────────────────────────┐
│  Edit Model: qwen-7b                    [×]           │
├────────────────────────────────────────────────────────────┤
│                                                    │
│  Model Settings                                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Model Path                         │          │  │
│  │ /models/qwen-7b-instruct-q4_k_m.gguf  [📁]    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                    │
│  Context Size    [4096]  ⓘ (8192 recommended)   │
│  GPU Layers     [35]     ⓘ (Full=42)           │
│  Load on Startup [✓]                                 │
│                                                    │
│  Performance                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Threads (0=auto)       │  [0]              │  │
│  │ Batch Size            │  [512]             │  │
│  │ uBatch Size           │  [512]             │  │
│  │ Cache RAM (MB)       │  [8192]            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                    │
│  Sampling Parameters                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Temperature           │  [0.7]  🔴 GPU  │  │
│  │ Top P                │  [0.9]           │  │
│  │ Top K                │  [40]             │  │
│  │ Min P                │  [0.05]           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                    │
│  ⚠️  Warning: Context size may exceed VRAM       │
│  💡 Tip: Consider reducing to 4096 for smoother   │
│     performance on 8GB GPU                        │
│                                                    │
│  [Reset to Group] [Reset to Global]               │
│                                                    │
│         [Cancel]                     [Save]          │
└────────────────────────────────────────────────────────────┘
```

### Inheritance Viewer Modal

```
┌────────────────────────────────────────────────────────────┐
│  Configuration: qwen-7b                     [Close]   │
├────────────────────────────────────────────────────────────┤
│                                                    │
│  Parameter          │ Value    │ Source               │
│  ────────────────────────────────────────────────────    │
│  model              │ /path/...│ Model (override)🟢  │
│  ctx-size           │ 4096     │ Group (override)🟡   │
│  temp              │ 0.7      │ Global (* )⚪       │
│  n-gpu-layers      │ 35        │ Model (override)🟢  │
│  threads           │ 8         │ Global (* )⚪       │
│  batch             │ 512       │ Group (override)🟡   │
│  top-p             │ 0.9       │ Global (* )⚪       │
│                                                    │
│  🟢 = Model-specific override                         │
│  🟡 = Group override                               │
│  ⚪ = Global default                               │
│                                                    │
│  [Copy to Clipboard] [View Raw INI]                 │
└────────────────────────────────────────────────────────────┘
```

---

## Parameter Reference (All llama.cpp Router Parameters)

### Model Settings

| Parameter         | Type   | Default  | Description                 |
| ----------------- | ------ | -------- | --------------------------- |
| `model`           | path   | required | Path to GGUF file           |
| `ctx-size`        | int    | 2048     | Context window size         |
| `ctx-checkpoints` | int    | 8        | Number of checkpoints       |
| `n-gpu-layers`    | int    | 0        | GPU layers to offload       |
| `split-mode`      | enum   | none     | none/layer/row              |
| `tensor-split`    | string | null     | GPU split (e.g., "1,1,1,1") |
| `main-gpu`        | int    | 0        | Primary GPU                 |
| `load-on-startup` | bool   | false    | Auto-load model             |

### Performance

| Parameter      | Type | Default | Description          |
| -------------- | ---- | ------- | -------------------- |
| `threads`      | int  | 0       | CPU threads (0=auto) |
| `batch`        | int  | 512     | Batch size           |
| `ubatch`       | int  | 512     | Micro-batch size     |
| `threads-http` | int  | 1       | HTTP request threads |
| `cache-ram`    | int  | 8192    | Cache in MB          |

### Sampling

| Parameter      | Type  | Default | Description            |
| -------------- | ----- | ------- | ---------------------- |
| `temp`         | float | 0.7     | Temperature            |
| `seed`         | int   | -1      | Random seed            |
| `top-p`        | float | 0.9     | Nucleus sampling       |
| `top-k`        | int   | 40      | Top-k sampling         |
| `min-p`        | float | 0.05    | Min-p sampling         |
| `mirostat`     | int   | 0       | Mirostat (0/1/2)       |
| `mirostat-lr`  | float | 0.1     | Mirostat learning rate |
| `mirostat-ent` | float | 5.0     | Mirostat entropy       |

### Speculative Decoding

| Parameter     | Type  | Default | Description           |
| ------------- | ----- | ------- | --------------------- |
| `draft-min`   | int   | 5       | Min draft tokens      |
| `draft-max`   | int   | 10      | Max draft tokens      |
| `draft-p-min` | float | 0.8     | Min draft probability |

---

## Success Criteria

### Phase 1 (MVP) - Week 1

- [ ] All CRUD operations work end-to-end
- [ ] Changes persist to INI files
- [ ] Basic validation prevents errors
- [ ] User can create functional preset

### Phase 2 (Enhanced UX) - Week 2

- [ ] Inheritance visualization is clear
- [ ] All parameters are accessible
- [ ] Smart features reduce manual work
- [ ] Real-time validation catches issues early

### Phase 3 (Visual Polish) - Week 3

- [ ] Responsive on all screen sizes
- [ ] Dark mode works
- [ ] Empty states guide users
- [ ] Animations are smooth

### Phase 4 (Advanced) - Ongoing

- [ ] Import/export works
- [ ] Preset sharing is easy
- [ ] Integration with other pages
- [ ] Power user features are available

---

## Questions to Answer

1. **Groups vs Direct Models**: Should models exist outside groups, or must all models be in a group?
   - Recommendation: Allow both for flexibility

2. **Auto-Discovery**: Should the UI auto-detect models from the configured models directory?
   - Recommendation: Yes, with option to manually add paths

3. **Preset Selection**: How does the user select which preset to use when starting llama-server?
   - Recommendation: Dropdown on Configuration page, or command in models page

4. **Validation Strictness**: Should invalid values be blocked or just warned?
   - Recommendation: Block critical errors, warn potential issues

5. **VRAM Calculation**: Do we have access to llama.cpp's VRAM calculation?
   - Recommendation: Estimate based on model metadata, provide "Test" button

6. **Model Path Handling**: Should paths be relative or absolute?
   - Recommendation: Store relative, resolve absolute at runtime

7. **Parameter Grouping**: How should we organize parameters in the UI?
   - Recommendation: Logical groups (Model, Performance, Sampling, Advanced)

8. **Presets vs Single File**: Do we support multiple preset files, or just one master config?
   - Recommendation: Support both - allow user to create multiple preset files

---

## Next Steps

1. **Review Plan**: Get feedback on this plan
2. **Prioritize Phases**: Decide which features are essential for first release
3. **Answer Questions**: Resolve the questions above
4. **Start Phase 1**: Implement core CRUD operations
5. **Test Early**: Test with real llama.cpp server after Phase 1
6. **Iterate**: Add features based on user feedback

---

## Technical Notes

### State Management

```javascript
// Preset state structure
{
  presets: [
    {
      name: 'default',
      filename: 'default.ini',
      globalDefaults: { /* ... */ },
      groups: [
        {
          name: 'gpu-models',
          models: [
            { name: 'qwen-7b', path: '...', config: { /* ... */ } }
          ]
        }
      ]
    }
  ],
  selectedPreset: 'default',
  editingGroup: null,
  editingModel: null
}
```

### Validation Schema

```javascript
const VALIDATION_RULES = {
  ctxSize: { min: 512, max: 131072, type: "integer" },
  temp: { min: 0.0, max: 2.0, type: "float" },
  nGpuLayers: { min: 0, max: 200, type: "integer" },
  // ... etc
};
```

### Error Handling

- Show user-friendly messages
- Suggest fixes for common errors
- Log technical details for debugging
- Allow retry with corrections

### Performance

- Debounce validation (300ms)
- Lazy load large presets
- Cache inheritance calculations
- Optimize re-renders
