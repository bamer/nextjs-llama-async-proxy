# Presets System - Complete Documentation

A comprehensive guide to the Presets system for managing llama-server configurations in the Llama Proxy Dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [User Guide](#user-guide)
4. [UI Structure](#ui-structure)
5. [API Reference](#api-reference)
6. [Architecture](#architecture)
7. [Features](#features)
8. [Implementation Details](#implementation-details)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Usage](#advanced-usage)
11. [Consolidated From](#consolidated-from)

---

## Overview

The Presets system allows users to create, manage, and launch llama-server with predefined configurations. Presets are stored as INI files in the `config/` directory and can include:

- Global defaults for all models
- Groups of models with shared parameters
- Individual standalone models with custom settings

### Key Features

- **Visual Configuration**: Create presets through the UI instead of CLI
- **Model Groups**: Apply the same parameters to multiple models
- **Global Defaults**: Set defaults that apply to all models
- **One-Click Launch**: Launch llama-server directly from the dashboard
- **INI Export**: Download presets for use outside the dashboard

---

## Quick Start

### 1. Start the Dashboard Server

```bash
cd /home/bamer/nextjs-llama-async-proxy
pnpm start
# Open http://localhost:3000
```

### 2. Create Your First Preset

1. Click **"⚡ Presets"** in the sidebar
2. Click **"+ New Preset"** button
3. Enter a name (e.g., "my-server")
4. Click **"Create"**

### 3. Add Models

1. Select the preset from the list
2. Click **"+ Add Model"**
3. Fill in:
   - Model Name (e.g., "llama2-7b")
   - Model Path (full path to .gguf file)
   - Context Size (default: 4096)
   - Temperature (default: 0.7)
   - GPU Layers
   - Threads
   - Batch Size
4. Click **"Add"**

### 4. Launch Server

1. Go to **Settings** page
2. Find **"Launch with Preset"** section
3. Select your preset from the dropdown
4. Click **"🚀 Launch Server with Preset"**

### 5. Verify

Check the notification for the server port (default: 8080):

```bash
curl http://localhost:8080/models
```

---

## User Guide

### Creating a Preset

#### Step 1: Navigate to Presets Page

Open the dashboard and click **"⚡ Presets"** in the sidebar.

#### Step 2: Create New Preset

1. Click **"+ New Preset"** button
2. Enter a unique name (no spaces, alphanumeric and hyphens only)
3. Click **"Create"**

#### Step 3: Add Models to Preset

With the preset selected, click **"+ Add Model"** and fill in:

| Field | Description | Default |
|-------|-------------|---------|
| Model Name | Section name in INI file | Required |
| Model Path | Full path to .gguf file | Required |
| Context Size | Token window | 4096 |
| Temperature | Randomness (0.0-2.0) | 0.7 |
| GPU Layers | Layers to offload to GPU | 0 |
| Threads | CPU threads to use | 4 |
| Batch Size | Batch processing size | 512 |

### Configuring Global Defaults

Click the **"Defaults"** section to set parameters that apply to all models:

- Context size
- GPU layers
- Thread count
- Other default parameters

### Using Groups

Groups allow you to apply the same parameters to multiple models:

1. Click **"+ Add Group"**
2. Name the group
3. Click **"+ Add Model"** inside the group
4. Select models from available list
5. Set group parameters (all models inherit these)

### Launching from Settings

1. Go to **Settings** page
2. Scroll to **"Launch with Preset"** section
3. Select your preset from dropdown
4. Click **"🚀 Launch Server with Preset"**

### Downloading Preset

1. Select the preset
2. Click **"⬇ Download"** button
3. Saves `.ini` file to your computer

### Copying Start Command

1. Select the preset
2. Click **"📋 Copy Command"** button
3. Run: `llama-server --models-preset ./config/my-preset.ini --models-max 4`

---

## UI Structure

### Layout Organization

```
Presets Page
├── Global Defaults
│   └── Editable parameters (apply to all models)
├── Groups
│   ├── Group A
│   │   ├── Model List (compact, read-only)
│   │   │   ├── Model 1 [×]
│   │   │   ├── Model 2 [×]
│   │   │   └── [+ Add Model]
│   │   └── Group Parameters (editable)
│   └── Group B
│       ├── Model List
│       └── Group Parameters
└── Standalone Models
    ├── Model 1 (fully customizable)
    ├── Model 2 (fully customizable)
    └── Model 3 (fully customizable)
```

### Group Section Structure

When expanded, each group shows:

```
📁 Group Name [model count] ▼ [Delete]
   ├─ Applies to (section title)
   │  ├─ [Model 1] [×]
   │  ├─ [Model 2] [×]
   │  └─ [+ Add Model]
   │
   └─ Group Parameters (section title)
      ├─ [Parameter 1 value] [Copy]
      ├─ [Parameter 2 value] [Copy]
      └─ etc...
```

### Standalone Model Section

When expanded, each model shows:

```
📄 Model Name [model-path] ▼ [×]
   ├─ [Parameter 1 value] [Copy]
   ├─ [Parameter 2 value] [Copy]
   └─ etc...
```

### UI Elements

| Element | Description |
|---------|-------------|
| **Expand/Collapse** | Click header to toggle |
| **Add Model** | Opens model selection dropdown |
| **Remove Model** | Click [×] next to model name |
| **Edit Parameter** | Click value to edit |
| **Copy Value** | Click [Copy] button to copy to clipboard |
| **Refresh Models** | Click "↻ Refresh Models" to reload model list |

---

## API Reference

### Socket.IO Events

#### `presets:list`

List all available presets.

**Request:**

```javascript
{}
```

**Response:**

```javascript
{
  success: true,
  data: {
    presets: Array<{
      name: string;       // Preset name (without .ini)
      path: string;       // Filename (with .ini)
      file: string;       // Full file path
    }>
  }
}
```

#### `presets:read`

Read a specific preset file.

**Request:**

```javascript
{ filename: "my-preset" }
```

**Response:**

```javascript
{
  success: true,
  data: {
    filename: string;
    content: string;   // Raw INI content
    parsed: {          // Parsed INI as object
      "*": { /* defaults */ },
      [modelName]: { /* model config */ }
    }
  }
}
```

#### `presets:create`

Create a new empty preset.

**Request:**

```javascript
{
  filename: "my-preset",
  description?: string
}
```

**Response:**

```javascript
{
  success: true,
  data: { filename: string; path: string; }
}
```

#### `presets:save`

Save/overwrite a preset with new configuration.

**Request:**

```javascript
{
  filename: "my-preset",
  config: {
    "*": {
      "ctx-size": 4096,
      "n-gpu-layers": 33,
      threads: 8
    },
    "model1": {
      model: "/models/model1.gguf",
      temperature: 0.7
    }
  }
}
```

#### `presets:delete`

Delete a preset file.

**Request:**

```javascript
{ filename: "my-preset" }
```

#### `presets:add-model`

Add or update a model in a preset.

**Request:**

```javascript
{
  filename: "my-preset",
  modelName: "llama2-7b",
  config: {
    model: "/models/llama2-7b.gguf",
    ctxSize: 2048,
    nGpuLayers: 33,
    temperature: 0.7,
    topP: 0.9
  }
}
```

#### `presets:remove-model`

Remove a model from a preset.

**Request:**

```javascript
{
  filename: "my-preset",
  modelName: "llama2-7b"
}
```

#### `presets:start-with-preset`

Start llama-server with a preset configuration.

**Request:**

```javascript
{
  filename: "my-preset",
  options: {
    maxModels?: number;   // Default: 4
    threads?: number;     // Default: 4
    ctxSize?: number;     // Default: 4096
  }
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    port: 8080,
    url: "http://127.0.0.1:8080",
    mode: "router",
    preset: "my-preset"
  }
}
```

**Error Response:**

```javascript
{
  success: false,
  error: { message: "Preset file not found: my-preset" }
}
```

#### `presets:stop-server`

Stop the running llama-server instance.

**Request:**

```javascript
{}
```

#### `presets:validate`

Validate INI file syntax.

**Request:**

```javascript
{ content: "[*]\nctx-size = 4096" }
```

**Response:**

```javascript
{
  success: true,
  data: { valid: true, errors: [] }
}
```

---

## Architecture

### File Structure

```
/project/
├── server/
│   ├── handlers.js              # Imports preset handlers
│   └── handlers/
│       └── presets.js           # All preset logic (456 lines)
│       └── llama-router/
│           └── start.js         # Router startup with presets
│
├── public/
│   ├── js/
│   │   ├── services/
│   │   │   └── presets.js       # Socket.IO service (207 lines)
│   │   ├── pages/
│   │   │   └── presets.js       # UI component (700+ lines)
│   │   └── components/layout/
│   │       └── layout.js        # Navigation updated
│   │
│   └── css/
│       ├── main.css             # Imports presets.css
│       └── pages/presets/
│           └── presets.css      # Styling (230+ lines)
│
└── config/                      # INI preset files
    └── *.ini                    # Auto-created on use
```

### State Flow

```
User Action (click)
        ↓
Event Handler (getEventMap)
        ↓
Method Call (handleClick)
        ↓
Socket.IO Emit (PresetsService)
        ↓
Server Handler (Socket.on)
        ↓
File Operation (read/write INI)
        ↓
Response Callback (ack)
        ↓
setState (update component)
        ↓
render() (re-render UI)
```

### INI File Format

```ini
LLAMA_CONFIG_VERSION = 1

; Global defaults applied to all models
[*]
ctx-size = 4096
n-gpu-layers = 33
threads = 8

; Individual model configuration
[llama2-7b]
model = /models/llama2-7b.gguf
temperature = 0.7
top-p = 0.9

[mistral-7b]
model = /models/mistral-7b.gguf
temperature = 0.5
n-gpu-layers = 40
```

---

## Features

### Section Expand/Collapse Animations

- Smooth slide-down and slide-up animations (0.3s ease-out)
- Used for: Global Defaults, Groups, and Model sections
- Works in all modern browsers

### Parameter Value Copy Buttons

- Quick-copy buttons next to parameter values
- Hover effect: button turns blue
- Copied feedback: changes to green checkmark (✓) for 2 seconds
- Success notification shows "Copied: [value]"
- Uses `navigator.clipboard.writeText()` API

### Parameter Search/Filter

- Real-time search filters parameters as you type
- Matches against parameter name and label
- Case-insensitive search
- Clear button (×) to quickly clear search
- Search box appears when section is expanded

### Model Loading

- Automatic loading when preset is selected
- Manual refresh button ("↻ Refresh Models") in header
- Shows count of found models
- Error handling with notifications

### Group Management

- Centralized parameter management for multiple models
- All models inherit group settings
- Compact model list view (no parameter duplication)
- Inline model removal with [×] button
- Add models from available models list

### Standalone Models

- Full parameter customization
- Independent from any group
- Only place where individual editing allowed

---

## Implementation Details

### Key Files Modified

| File | Changes |
|------|---------|
| `server/handlers/presets.js` | All Socket.IO handlers (456 lines) |
| `server/handlers/llama-router/start.js` | Dual mode support |
| `public/js/services/presets.js` | Socket.IO service (207 lines) |
| `public/js/pages/presets.js` | UI component (700+ lines) |
| `public/js/components/layout/layout.js` | Navigation updated |
| `public/css/pages/presets/presets.css` | Styling (230+ lines) |

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.group-models-section` | Container for model list |
| `.models-list-compact` | Flex container for model items |
| `.model-list-item` | Individual model row |
| `.model-name` | Model name text |
| `.btn-remove-model` | Remove button styling |
| `.group-params-section` | Parameters container |
| `.header-top` | Flex layout for title + button |
| `.refresh-models-btn` | Button styling |

### Component Methods

| Method | Purpose |
|--------|---------|
| `renderGroupSection()` | Renders group with model list + params |
| `renderModelSection()` | Renders standalone model |
| `renderEditableParams()` | Renders editable parameter form |
| `renderReadOnlyParams()` | Renders read-only parameters |
| `handleStartEdit()` | Start editing a parameter |
| `handleSaveEdit()` | Save parameter changes |
| `handleDeleteModel()` | Remove model from group |
| `handleToggleGroup()` | Expand/collapse group |
| `handleRefreshModels()` | Reload available models |
| `handleCopyValue()` | Copy parameter to clipboard |

---

## Troubleshooting

### "Preset file not found"

**Cause**: Preset file doesn't exist in `./config/`

**Solution**:
```bash
# Check preset exists
ls -la ./config/your-preset.ini

# Create it first
stateManager.request("presets:create", { filename: "your-preset" })
```

### "Model file not found"

**Cause**: Model path is incorrect

**Solution**:
```javascript
await stateManager.request("presets:update-model", {
  filename: "test",
  modelName: "my-model",
  config: {
    model: "/absolute/path/to/model.gguf"  // Must be absolute path
  }
});
```

### "Please select a preset"

**Cause**: No preset selected in Settings dropdown

**Solution**: Select a preset from the dropdown first

### Models not in list

**Cause**: Base models path not configured

**Solution**: Check `baseModelsPath` setting in configuration

### Can't edit model in group

**Cause**: By design - models in groups inherit parameters

**Solution**: Remove model from group first, then add to Standalone section

### Empty available models

**Cause**: Models directory doesn't exist or is empty

**Solution**: Verify models directory exists with .gguf files

### Server won't start

**Check**:
1. Is preset file created? (`./config/`)
2. Are model paths correct? (`ls` command)
3. Is llama-server installed? (check PATH)
4. Is port available? (retry, system picks next port)

---

## Advanced Usage

### Manual Command Line

If you prefer command line instead of Settings UI:

```bash
# Use preset file directly
llama-server --models-preset ./config/my-preset.ini --models-max 4 --port 8080
```

### Edit INI Directly

Advanced users can edit the INI file directly:

```bash
nano ./config/my-preset.ini
```

### Version Control

Keep presets in git:

```bash
git add ./config/*.ini
git commit -m "Add presets for prod and dev"
```

### Multiple Presets for Different Use Cases

- **development.ini** - Small models, low resources
- **production.ini** - Large models, high resources
- **testing.ini** - Specific test configuration

### Common Scenarios

#### Development Setup

```ini
[dev]
ctx-size = 2048
n-gpu-layers = 20
threads = 4
```

#### Production Setup

```ini
[prod]
ctx-size = 8192
n-gpu-layers = 40+
threads = 16
```

#### API Server

```ini
[api]
ctx-size = 4096
n-gpu-layers = 33
threads = 8
```

---

## Error Messages & User Feedback

| Action | Feedback |
|--------|----------|
| Add model to group | "Model 'X' added" (success) |
| Remove model from group | "Model 'X' removed" (success) |
| Save group parameters | "Saved successfully" (success) |
| Try to edit group model | Info message about inheritance |
| Delete group | Confirmation required |
| Preset file not found | Error message with filename |
| llama-server binary not found | Error message |
| Port already in use | Auto-selects next port |

---

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

---

## Performance

- ✅ Reduced DOM complexity (fewer parameter nodes)
- ✅ Faster rendering
- ✅ Less memory usage
- ✅ Efficient model loading (only when needed)

---

## API Response Format

All Socket.IO responses follow this format:

```javascript
// Success
{
  success: true,
  data: { /* response data */ }
}

// Error
{
  success: false,
  error: {
    message: string,
    code?: string
  }
}
```

---

## Consolidated From

This document was consolidated from the following source files:

1. `PRESETS_USER_GUIDE.md` - Complete user workflow tutorial
2. `PRESETS_QUICK_REFERENCE.md` - Quick reference guide
3. `PRESETS_QUICK_START.md` - Quick start implementation guide
4. `PRESETS_FEATURES.md` - Enhanced features documentation
5. `PRESETS_FINAL_STATUS.md` - Integration final status
6. `PRESETS_FINAL_SUMMARY.md` - Complete implementation summary
7. `PRESETS_LAUNCH_SUMMARY.md` - Launch feature integration
8. `PRESETS_LAUNCH_API.md` - Complete API reference (833 lines)
9. `PRESETS_INTEGRATION_COMPLETE.md` - Integration status
10. `PRESETS_UI_STRUCTURE.md` - UI structure reference
11. `PRESETS_REFACTOR_DETAILS.md` - Code-level refactor details
12. `PRESETS_LOGIC_FIX.md` - Group logic fix documentation

---

**Last Updated**: January 2026  
**Version**: 1.0 (Consolidated)
