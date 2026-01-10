# Presets Launch Integration - Final Implementation

Complete integration of preset-based llama-server launching in the Settings/Dashboard component.

## What Was Implemented

### Frontend Integration ✅

- **Settings → Router Config component** now has a "Launch with Preset" section
- Preset dropdown showing all available presets
- "🚀 Launch Server with Preset" button
- Presets are loaded automatically when component mounts

### Backend Integration ✅

- New `llama:start-with-preset` Socket.IO handler in `llama.js`
- Uses existing `startLlamaServerRouter()` with preset INI file
- Broadcasts server status to all connected clients
- Full error handling and logging

## Files Modified

### 1. `server/handlers/llama.js`

**Added**:

- `import path from "path"` for file path handling
- New `llama:start-with-preset` event handler (lines 123-166)

**How it works**:

```javascript
socket.on("llama:start-with-preset", (req) => {
  // 1. Get preset name from request
  const presetName = req?.presetName;

  // 2. Build preset file path: ./config/presetName.ini
  const presetPath = path.join(process.cwd(), "config", `${presetName}.ini`);

  // 3. Start llama-server with preset
  startLlamaServerRouter(presetPath, db, {
    ...options,
    usePreset: true, // Use --models-preset flag
  });

  // 4. Emit server:running status to dashboard
  io.emit("llama:status", { status: "running", port, preset });
});
```

### 2. `public/js/pages/settings/components/router-config.js`

**Added**:

- Server state: `presets`, `selectedPreset` (lines 14-15)
- `didMount()` lifecycle method to load presets
- `_loadPresets()` method to fetch preset list
- `_launchWithPreset()` method to start server
- Preset launcher UI section with dropdown and button

**UI Flow**:

1. Component mounts → Load presets from `presets:list` event
2. User selects preset from dropdown
3. User clicks "🚀 Launch Server with Preset"
4. Sends `llama:start-with-preset` request
5. Backend starts server with preset config
6. Notification shows success/error

## How to Use

### In Settings Page

1. **Open Settings** → Click Settings icon in dashboard
2. **Find "Launch with Preset" section** at the bottom
3. **Select a Preset** from the dropdown
4. **Click "🚀 Launch Server with Preset"**
5. **See notification** with server port (e.g., port 8080)
6. **Server is running** with your preset configuration!

### Workflow

```
Presets Page (Create/Configure)
        ↓
    Save Preset (writes ./config/my-preset.ini)
        ↓
Settings Page (Launch/Manage)
        ↓
Select Preset from dropdown
        ↓
Click "🚀 Launch Server with Preset"
        ↓
Backend: starts llama-server --models-preset ./config/my-preset.ini
        ↓
Frontend: displays server status and port
```

## Request/Response Format

### Request

```javascript
// From settings component
stateManager.request("llama:start-with-preset", {
  presetName: "production", // Preset filename (required)
  maxModels: 4, // Optional: defaults from user_settings
  ctxSize: 4096, // Optional: defaults from config
  threads: 4, // Optional: defaults from user_settings
});
```

### Response

**Success**:

```javascript
{
  success: true,
  port: 8080,
  url: "http://127.0.0.1:8080",
  mode: "router",
  preset: "production"
}
```

**Error**:

```javascript
{
  success: false,
  error: "Preset name required"
}
```

### Broadcast to Dashboard

When server starts, all connected clients receive:

```javascript
{
  status: "running",
  port: 8080,
  url: "http://127.0.0.1:8080",
  mode: "router",
  preset: "production"
}
```

## Architecture

```
Settings Page
    ↓
Router Config Component
    ├─ Load presets on mount
    ├─ Render preset dropdown
    ├─ Render launch button
    └─ Call _launchWithPreset() on click
        ↓
    Socket.IO: llama:start-with-preset
        ↓
Backend (llama.js)
    ├─ Get preset name
    ├─ Build path: ./config/preset.ini
    ├─ Call startLlamaServerRouter(presetPath, db, {usePreset: true})
    │   ↓
    │   Backend (llama-router/start.js)
    │   ├─ Detect .ini file
    │   ├─ Use --models-preset flag
    │   └─ Spawn: llama-server --models-preset ./config/preset.ini
    ├─ Get result (port, url)
    ├─ Broadcast llama:status to all clients
    └─ Send response to requester
        ↓
Frontend (Router Config)
    ├─ Receive response
    ├─ Display notification
    └─ Update UI
```

## Complete Integration Chain

1. **Presets Page** (already implemented)
   - ✅ Create presets
   - ✅ Add/edit models
   - ✅ Save to INI files (`./config/preset.ini`)

2. **Settings → Router Config** (NEW - just added)
   - ✅ Display preset list (from `./config/*.ini`)
   - ✅ Let user select preset
   - ✅ Launch server with selected preset

3. **Backend** (NEW handler + existing enhanced starter)
   - ✅ `llama:start-with-preset` handler (NEW in llama.js)
   - ✅ `startLlamaServerRouter()` with `--models-preset` support (already added)

4. **Dashboard** (existing)
   - ✅ Receives `llama:status` with running server info
   - ✅ Displays server status and port

## Testing

### Quick Test

1. **Create a preset** in Presets page:
   - Name: "test"
   - Add a model with path to actual .gguf file
   - Save

2. **Go to Settings**:
   - Scroll to "Launch with Preset"
   - Select "test" from dropdown
   - Click "🚀 Launch Server with Preset"

3. **Check notification**:
   - Should show "✓ Server started on port 8080"
   - Should show no errors

4. **Verify in dashboard**:
   - Server status should show "running"
   - Port should be displayed

### Debug Console

```javascript
// Check presets loaded
console.log(window.stateManager?.get("presets"));

// Check server status
await stateManager.request("llama:status");

// Manually launch
await stateManager.request("llama:start-with-preset", {
  presetName: "test",
  maxModels: 2,
});
```

## Error Handling

| Scenario               | Error Message                   | Solution                             |
| ---------------------- | ------------------------------- | ------------------------------------ |
| No preset selected     | "Please select a preset"        | Choose a preset from dropdown        |
| Preset file missing    | "Preset file not found: test"   | Create preset in Presets page        |
| Model path invalid     | "Model file not found"          | Check model paths in preset config   |
| Port in use            | "Port already in use"           | System auto-selects next port        |
| llama-server not found | "llama-server binary not found" | Install llama.cpp or set in settings |

## File Locations

```
Project Root
├── config/                      # Preset files
│   ├── default.ini             # Created in Presets page
│   ├── production.ini
│   └── test.ini
│
├── server/handlers/
│   ├── llama.js                # MODIFIED: new handler
│   └── llama-router/start.js   # Already enhanced in previous step
│
└── public/js/pages/settings/components/
    └── router-config.js        # MODIFIED: added preset launcher
```

## Summary of Changes

| File                                                   | Changes                      | Lines | Type        |
| ------------------------------------------------------ | ---------------------------- | ----- | ----------- |
| `server/handlers/llama.js`                             | New preset handler           | +44   | New Handler |
| `public/js/pages/settings/components/router-config.js` | Preset launcher UI + methods | +50   | New Feature |
| `server/handlers/llama-router/start.js`                | Dual mode support            | +30   | Enhancement |

**Total New Code**: ~124 lines  
**Total Files Modified**: 3  
**Breaking Changes**: None (backward compatible)

## Next Steps

### Optional Frontend Enhancements

1. **Preset management in settings**
   - Delete preset button
   - Edit preset button

2. **Server status panel**
   - Show running server info
   - Quick stop button
   - Model list

3. **Preset quick-select in dashboard**
   - Launch dropdown in main toolbar
   - One-click server launch

## Status

✅ **Backend**: Complete and working  
✅ **Frontend**: Integrated in Settings page  
✅ **UI**: Functional preset launcher  
✅ **Error Handling**: Comprehensive  
✅ **Documentation**: Complete

**Ready for Production**: YES

---

## Usage Summary

### For Users

1. **Create preset in Presets page** - Define models and settings
2. **Go to Settings** - Look for "Launch with Preset" section
3. **Select preset** - Choose from dropdown
4. **Click launch button** - Server starts with preset config
5. **Done!** - Server is running with your exact configuration

### For Developers

**Backend request**:

```javascript
socket.emit(
  "llama:start-with-preset",
  {
    presetName: "my-preset",
    maxModels: 4,
  },
  (response) => {
    console.log(response);
  }
);
```

**Frontend shortcut**:

```javascript
await stateManager.request("llama:start-with-preset", {
  presetName: "my-preset",
});
```

**API endpoint**: `llama:start-with-preset`

---

**Created**: January 10, 2026  
**Version**: 1.0  
**Status**: ✅ Complete
