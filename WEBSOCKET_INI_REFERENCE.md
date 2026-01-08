# WebSocket INI Preset Integration - Quick Reference

## 🎯 At a Glance

- **Backend**: `server/handlers/presets.js` (12.3 KB)
- **Frontend**: `public/js/services/presets.js` (6.3 KB)
- **Communication**: Socket.IO WebSocket events
- **Storage**: `config/` directory (auto-created)
- **Format**: INI with sections for each model

## 📡 Socket Events

### All 10 Event Types

```javascript
// CRUD Operations
socket.emit("presets:list", {}, callback)
socket.emit("presets:read", { filename }, callback)
socket.emit("presets:create", { filename }, callback)
socket.emit("presets:save", { filename, config }, callback)
socket.emit("presets:delete", { filename }, callback)

// Model Operations
socket.emit("presets:get-models", { filename }, callback)
socket.emit("presets:add-model", { filename, modelName, config }, callback)
socket.emit("presets:update-model", { filename, modelName, config }, callback)
socket.emit("presets:remove-model", { filename, modelName }, callback)

// Validation
socket.emit("presets:validate", { content }, callback)
```

### Response Format

```javascript
callback({
  success: true,              // or false
  data: { /* result */ },     // only if success=true
  error: { message: "..." },  // only if success=false
  timestamp: "ISO-string"
})
```

## 🔧 API Methods

### PresetsService Class

```javascript
// Create instance
const service = new PresetsService(socket);

// Methods (all async, return Promise)
service.listPresets()
service.readPreset(filename)
service.createPreset(filename, description?)
service.savePreset(filename, config)
service.deletePreset(filename)
service.validateIni(content)
service.getModelsFromPreset(filename)
service.addModel(filename, modelName, config)
service.updateModel(filename, modelName, config)
service.removeModel(filename, modelName)
```

## 📋 Example: Create and Configure Preset

```javascript
// 1. Create new preset
await service.createPreset("my-models");

// 2. Add first model
await service.addModel("my-models", "gemma-4b", {
  model: "./models/gemma-4b.gguf",
  ctxSize: 8192,
  temperature: 0.7,
  nGpuLayers: 99,
});

// 3. Add second model
await service.addModel("my-models", "llama-70b", {
  model: "./models/llama-70b.gguf",
  ctxSize: 4096,
  temperature: 0.8,
  nGpuLayers: 50,
  tensorSplit: "0.5,0.5",
});

// 4. Verify
const models = await service.getModelsFromPreset("my-models");
console.log(models);
// {
//   "gemma-4b": { model: "...", ctxSize: 8192, ... },
//   "llama-70b": { model: "...", ctxSize: 4096, ... }
// }

// 5. Use with llama-server
// llama-server --models-preset ./config/my-models.ini
```

## 📊 Generated INI Format

Automatically generated from model configs:

```ini
LLAMA_CONFIG_VERSION = 1

[gemma-4b]
model = ./models/gemma-4b.gguf
ctx-size = 8192
temp = 0.7
n-gpu-layers = 99

[llama-70b]
model = ./models/llama-70b.gguf
ctx-size = 4096
temp = 0.8
n-gpu-layers = 50
tensor-split = 0.5,0.5
```

## 🔄 Data Type Conversions

### JavaScript Config Object
```javascript
{
  model: "./models/model.gguf",      // string
  ctxSize: 8192,                     // number
  temperature: 0.7,                  // number
  nGpuLayers: 99,                    // number
  threads: 8,                        // number
  batchSize: 512,                    // number
  ubatchSize: 512,                   // number
  tensorSplit: "0.5,0.5",            // string (optional)
  mmp: "./mmproj.gguf"              // string (optional)
}
```

### INI Section
```ini
[model-name]
model = ./models/model.gguf
ctx-size = 8192
temp = 0.7
n-gpu-layers = 99
threads = 8
batch = 512
ubatch = 512
tensor-split = 0.5,0.5
mmp = ./mmproj.gguf
```

**Key Differences:**
- JavaScript uses camelCase (ctxSize, nGpuLayers)
- INI uses kebab-case (ctx-size, n-gpu-layers)
- Service handles conversion automatically

## 🎓 Common Patterns

### Pattern 1: List and Display Presets

```javascript
try {
  const presets = await service.listPresets();
  
  presets.forEach(preset => {
    console.log(`${preset.name} - ${preset.file}`);
  });
} catch (error) {
  console.error(error.message);
}
```

### Pattern 2: Load Preset Models

```javascript
try {
  const models = await service.getModelsFromPreset("default");
  
  for (const [name, config] of Object.entries(models)) {
    console.log(`${name}: ${config.model}`);
  }
} catch (error) {
  console.error(error.message);
}
```

### Pattern 3: Modify and Save

```javascript
try {
  // Read current preset
  const preset = await service.readPreset("default");
  
  // Modify
  preset.parsed["new-model"] = {
    model: "./models/new.gguf",
    "ctx-size": "8192",
    temp: "0.7"
  };
  
  // Save changes
  await service.savePreset("default", preset.parsed);
} catch (error) {
  console.error(error.message);
}
```

### Pattern 4: Create from Template

```javascript
const createPresetFromTemplate = async (name, template) => {
  try {
    // Create
    await service.createPreset(name);
    
    // Add models from template
    for (const [modelName, config] of Object.entries(template)) {
      await service.addModel(name, modelName, config);
    }
    
    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
};

// Usage
const gpuHeavyTemplate = {
  "large-model": {
    model: "./models/llama-70b.gguf",
    ctxSize: 4096,
    nGpuLayers: 99
  },
  "tiny-model": {
    model: "./models/tinyllama.gguf",
    ctxSize: 2048,
    nGpuLayers: 99
  }
};

await createPresetFromTemplate("gpu-heavy", gpuHeavyTemplate);
```

## 🚨 Error Handling

### Standard Try-Catch

```javascript
try {
  const preset = await service.readPreset("nonexistent");
} catch (error) {
  // error.message = "Failed to read preset: Preset file not found: nonexistent"
  showNotification(error.message, "error");
}
```

### Validation Errors

```javascript
try {
  const validation = await service.validateIni(content);
  
  if (!validation.valid) {
    // validation.errors is array of strings
    validation.errors.forEach(err => {
      console.error(err);
      // "[model]: Missing required 'model' parameter"
      // "[model]: Invalid ctx-size value: abc"
    });
  }
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

## 📂 Directory Structure

```
project-root/
├── config/                          # INI preset files (auto-created)
│   ├── default.ini
│   ├── gpu-heavy.ini
│   └── balanced.ini
│
├── server/
│   ├── handlers.js                  # ← Updated to register presets
│   └── handlers/
│       ├── presets.js               # ← NEW: Backend handler
│       └── response.js
│
├── public/js/
│   ├── services/
│   │   ├── presets.js               # ← NEW: Frontend service
│   │   ├── socket.js
│   │   └── ...
│   └── app.js
│
└── docs/
    ├── INI_WEBSOCKET_INTEGRATION.md
    ├── PRESET_QUICKSTART.md
    ├── PRESET_IMPLEMENTATION_NOTES.md
    ├── PRESET_IMPLEMENTATION_SUMMARY.md
    └── WEBSOCKET_INI_REFERENCE.md   # ← You are here
```

## 🔌 Integration Checklist

- [x] Backend handler created
- [x] Frontend service created
- [x] Handler registered in `server/handlers.js`
- [ ] UI component for preset management
- [ ] Form for model configuration
- [ ] Integration with configuration page
- [ ] Testing with llama-server
- [ ] Create template presets

## 🧪 Quick Test

```javascript
// In browser console
const ps = new PresetsService(socketClient);

// Create
await ps.createPreset("test-preset");

// Add model
await ps.addModel("test-preset", "test-model", {
  model: "./models/test.gguf",
  ctxSize: 2048
});

// Get models
const models = await ps.getModelsFromPreset("test-preset");
console.log(models);

// List
const all = await ps.listPresets();
console.log(all);

// Clean up
await ps.deletePreset("test-preset");
```

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| **INI_WEBSOCKET_INTEGRATION.md** | Complete technical guide + implementation steps |
| **PRESET_QUICKSTART.md** | Usage examples + API reference |
| **PRESET_IMPLEMENTATION_NOTES.md** | Architecture details + technical deep dive |
| **PRESET_IMPLEMENTATION_SUMMARY.md** | Overview + next steps |
| **WEBSOCKET_INI_REFERENCE.md** | Quick reference (this file) |

## 🔗 Quick Links

- Backend implementation: `server/handlers/presets.js`
- Frontend service: `public/js/services/presets.js`
- Handler registration: `server/handlers.js:32,53`
- Config directory: `process.cwd()/config/`

## 💡 Tips

1. **Always await** service methods (they return Promises)
2. **Check validation** before saving large configs
3. **Log events** in browser/server console with `[DEBUG]`
4. **Use error handling** - all operations can fail
5. **INI format matters** - parameter names are case-sensitive
6. **Numeric values** stored as strings in INI, auto-converted

## ⚡ Performance Notes

- Synchronous file I/O (fine for config files, ~100s of models)
- No caching (fresh read each request)
- No file watching (manual reload needed)
- Safe for concurrent requests (Socket.IO handles queuing)

---

**For detailed guides, see documentation folder** 📚
