# INI Preset Implementation - Technical Notes

## Architecture

### Communication Flow

```
Frontend (Browser)
       ↓
    Socket.IO Event
    (presets:operation)
       ↓
Backend Socket Handler
(server/handlers/presets.js)
       ↓
File System Operations
(read/write INI files)
       ↓
Socket.IO Response
{success, data, error}
       ↓
Frontend Promise Callback
```

### File Organization

```
Project Root
├── server/
│   └── handlers/
│       ├── presets.js              ← INI file operations
│       └── response.js             ← Standard response format
├── public/js/
│   ├── services/
│   │   └── presets.js              ← Frontend service wrapper
│   └── app.js                      ← Main app initialization
├── config/                          ← Auto-created INI files here
│   └── *.ini
└── INI_WEBSOCKET_INTEGRATION.md
```

## Implementation Details

### Backend Handler: `server/handlers/presets.js`

**Key Functions:**

1. **parseIni(content)** - Parses INI file content into JS object
   ```javascript
   parseIni("[model]\nkey=value") 
   // → { model: { key: "value" } }
   ```

2. **generateIni(config)** - Converts config object to INI format
   ```javascript
   generateIni({ model: { key: "value" } })
   // → "[model]\nkey=value\n"
   ```

3. **modelToIniSection(name, config)** - Converts model config to INI section
   - Input: camelCase config object
   - Output: kebab-case INI section

4. **iniSectionToModel(section)** - Converts INI section to config object
   - Input: kebab-case INI values
   - Output: camelCase config object

### Frontend Service: `public/js/services/presets.js`

**All Methods Return Promises:**

```javascript
// Constructor
new PresetsService(socket)

// Methods
.listPresets()               // → Array<preset>
.readPreset(filename)        // → { filename, content, parsed }
.savePreset(filename, config) // → { filename, path }
.createPreset(filename)      // → { filename, path }
.deletePreset(filename)      // → { filename }
.validateIni(content)        // → { valid, errors }
.getModelsFromPreset(filename) // → { modelName: config }
.addModel(filename, name, config) // → { filename, modelName, config }
.updateModel(filename, name, config) // → { filename, modelName, config }
.removeModel(filename, name)  // → { filename, modelName }
```

## Socket.IO Events

### Event Signature

```javascript
socket.emit("presets:operation", data, callback)

// Server responds via callback
callback({
  success: true/false,
  data: { /* operation result */ },
  error: { message: "error text" },
  timestamp: "2025-01-08T..." 
})
```

### All Events

| Event | Input | Output |
|-------|-------|--------|
| `presets:list` | `{}` | `{ presets: [{ name, path, file }] }` |
| `presets:read` | `{ filename }` | `{ filename, content, parsed }` |
| `presets:save` | `{ filename, config }` | `{ filename, path }` |
| `presets:create` | `{ filename, description? }` | `{ filename, path }` |
| `presets:delete` | `{ filename }` | `{ filename }` |
| `presets:validate` | `{ content }` | `{ valid, errors[] }` |
| `presets:get-models` | `{ filename }` | `{ models: { name: config } }` |
| `presets:add-model` | `{ filename, modelName, config }` | `{ filename, modelName, config }` |
| `presets:update-model` | `{ filename, modelName, config }` | `{ filename, modelName, config }` |
| `presets:remove-model` | `{ filename, modelName }` | `{ filename, modelName }` |

## Data Transformations

### Model Config Object ↔ INI Section

**JavaScript Object (camelCase):**
```javascript
{
  model: "./models/model.gguf",
  ctxSize: 8192,
  temperature: 0.7,
  nGpuLayers: 99,
  tensorSplit: "0.5,0.5"
}
```

**INI Section (kebab-case):**
```ini
[model-name]
model = ./models/model.gguf
ctx-size = 8192
temp = 0.7
n-gpu-layers = 99
tensor-split = 0.5,0.5
```

**Conversion Logic:**
- Backend handles camelCase ↔ kebab-case conversion
- Frontend uses camelCase internally
- Service methods handle translation

### Config Object Structure

```javascript
{
  // Required
  model: string,           // Path to GGUF file

  // Numeric (converted to/from string in INI)
  ctxSize: number,         // Context size (default: 2048)
  temperature: number,     // Sampling temperature (default: 0.7)
  nGpuLayers: number,      // GPU layers to offload (default: 0)
  threads: number,         // Thread count (default: 0)
  batchSize: number,       // Batch size (default: 512)
  ubatchSize: number,      // Ubatch size (default: 512)

  // String (optional)
  tensorSplit: string,     // GPU split ratio "0.5,0.5"
  mmp: string             // Multimodal project path
}
```

## Error Handling

### Backend Errors

All errors caught and passed via callback:

```javascript
socket.on("presets:read", (data, callback) => {
  try {
    const preset = readPreset(data.filename);
    callback(ok(preset));
  } catch (error) {
    callback(err(error.message));
  }
});
```

Response:
```javascript
{
  success: false,
  error: { message: "Preset file not found: mypreset" }
}
```

### Frontend Error Handling

```javascript
try {
  const preset = await presetsService.readPreset("mypreset");
  // Use preset...
} catch (error) {
  console.error(error.message);
  showNotification(error.message, "error");
}
```

### Validation Errors

INI validation returns array of errors:

```javascript
const validation = await presetsService.validateIni(content);

if (!validation.valid) {
  // validation.errors = [
  //   "[model1]: Missing required 'model' parameter",
  //   "[model2]: Invalid ctx-size value: abc"
  // ]
}
```

## Integration Points

### 1. In App Initialization

```javascript
// app.js
import PresetsService from "./services/presets.js";

window.presetsService = new PresetsService(socketClient);
```

### 2. In State Manager

```javascript
// Add to state management
stateManager.set("presets", []);
stateManager.set("currentPreset", null);

// Add methods
stateManager.loadPresets = async () => {
  const presets = await window.presetsService.listPresets();
  stateManager.set("presets", presets);
};
```

### 3. In Controllers

```javascript
class MyController {
  async init() {
    try {
      const presets = await window.presetsService.listPresets();
      // Use presets...
    } catch (error) {
      showNotification(error.message, "error");
    }
  }
}
```

### 4. In UI Components

```javascript
class PresetSelector extends Component {
  async didMount() {
    const presets = await window.presetsService.listPresets();
    this.setState({ presets });
  }

  handleSelectPreset(presetName) {
    window.presetsService.readPreset(presetName)
      .then(data => {
        const models = this.state.presets.find(p => p.name === presetName);
        // Update UI...
      })
      .catch(error => showNotification(error.message, "error"));
  }
}
```

## Debug Logging

All operations log to console with `[DEBUG]` prefix:

```javascript
// Backend
console.log("[DEBUG] Preset saved:", { filename, path });
console.log("[DEBUG] Event: presets:add-model", { filename, model });

// Frontend
console.log("[DEBUG] PresetsService: listPresets");
console.log("[DEBUG] PresetsService: addModel", { filename, modelName });
```

View logs in:
- **Browser Console**: Frontend debug logs
- **Server Console**: Backend debug logs and errors

## File System Notes

### Directory Creation

`config/` directory auto-created if missing:

```javascript
if (!fs.existsSync(PRESETS_DIR)) {
  fs.mkdirSync(PRESETS_DIR, { recursive: true });
}
```

### File Naming

- Preset names cannot contain `/` or `\`
- `.ini` extension added automatically
- Filename: `config/{name}.ini`

### File Operations

- **Read**: `fs.readFileSync()` (sync)
- **Write**: `fs.writeFileSync()` (sync, blocks)
- **Delete**: `fs.unlinkSync()` (sync)
- **List**: `fs.readdirSync()` (sync)

All operations wrapped in try-catch for error handling.

## Performance Considerations

### Current Implementation

- Synchronous file I/O (blocking, but fine for config files)
- No caching (fresh read on each request)
- No file watching (changes require manual reload)

### Future Optimizations

```javascript
// Could add:
// - Async file operations
// - In-memory cache with TTL
// - File system watcher
// - Batch operations
// - Compression for large configs
```

## Testing Checklist

When implementing UI for presets:

- [ ] Create new preset
- [ ] List all presets
- [ ] Read preset content
- [ ] Add model to preset
- [ ] Update model in preset
- [ ] Remove model from preset
- [ ] Validate INI syntax
- [ ] Save full preset config
- [ ] Delete preset
- [ ] Handle errors gracefully
- [ ] Check console logs for `[DEBUG]` messages
- [ ] Verify config directory created
- [ ] Check generated INI files format

## Troubleshooting Guide

### Presets not appearing in list

1. Check `config/` directory exists
2. Verify file permissions
3. Check browser console for socket errors
4. Look for `[DEBUG]` logs in server console

### INI file not saving

1. Check write permissions on `config/` dir
2. Look for file system errors in server logs
3. Use `validateIni()` to check syntax
4. Check file path doesn't exceed OS limits

### Socket events not firing

1. Verify socket connection established
2. Check event names match exactly
3. Ensure callback function provided
4. Look for network errors in DevTools

### Model config mismatch

1. Use `validateIni()` before saving
2. Check parameter names (camelCase in JS, kebab-case in INI)
3. Verify numeric values parse correctly
4. Review `modelToIniSection()` and `iniSectionToModel()` logic
