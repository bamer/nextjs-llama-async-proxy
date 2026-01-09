# Presets Launch - Quick Start Guide

Get llama-server running with a preset in 5 minutes.

## Installation (Backend Only)

The backend is **already implemented**. No installation needed.

**Modified Files**:
- ✅ `server/handlers/llama-router/start.js` - Dual mode support
- ✅ `server/handlers/presets.js` - Launch handlers

## Quick Test

### 1. Start the Dashboard Server

```bash
cd /home/bamer/nextjs-llama-async-proxy
pnpm start
# Open http://localhost:3000
```

### 2. Create a Test Preset

In browser console or via HTTP:

```javascript
// Create preset
await stateManager.request("presets:create", { 
  filename: "test" 
});

// Add a model
await stateManager.request("presets:add-model", {
  filename: "test",
  modelName: "my-model",
  config: {
    model: "/path/to/your/model.gguf"
  }
});

// Save preset
await stateManager.request("presets:save", {
  filename: "test",
  config: {
    "*": { "ctx-size": 4096 },
    "my-model": { "model": "/path/to/your/model.gguf" }
  }
});
```

### 3. Launch Server with Preset

```javascript
// Start llama-server with preset
const response = await stateManager.request(
  "presets:start-with-preset",
  {
    filename: "test",
    options: {
      maxModels: 4,
      threads: 4,
      ctxSize: 4096
    }
  }
);

console.log(response);
// Output:
// {
//   success: true,
//   data: {
//     port: 8080,
//     url: "http://127.0.0.1:8080",
//     mode: "router",
//     preset: "test"
//   }
// }
```

### 4. Verify Server Running

```bash
# Check server is responding
curl http://localhost:8080/models

# Should return model list in router mode
```

### 5. Stop Server

```javascript
// Stop when done
await stateManager.request("presets:stop-server");
```

## Common Use Cases

### Use Case 1: Development Configuration

```javascript
// Create dev preset
await stateManager.request("presets:create", { filename: "dev" });

// Add fast, small models for testing
await stateManager.request("presets:add-model", {
  filename: "dev",
  modelName: "phi-2.8b",
  config: {
    model: "/models/phi-2.8b.gguf",
    ctxSize: 2048,
    nGpuLayers: 20,
    temperature: 0.7
  }
});

// Launch with minimal resources
await stateManager.request("presets:start-with-preset", {
  filename: "dev",
  options: { maxModels: 2, threads: 4 }
});
```

### Use Case 2: Production Configuration

```javascript
// Create production preset
await stateManager.request("presets:create", { filename: "prod" });

// Add multiple production models
await stateManager.request("presets:add-model", {
  filename: "prod",
  modelName: "llama2-13b",
  config: {
    model: "/models/llama2-13b.gguf",
    ctxSize: 8192,
    nGpuLayers: 40,
    temperature: 0.3,  // Lower for consistency
    seed: 42          // Fixed seed for reproducibility
  }
});

// Launch with production settings
await stateManager.request("presets:start-with-preset", {
  filename: "prod",
  options: { maxModels: 8, threads: 16, ctxSize: 8192 }
});
```

### Use Case 3: Multi-Model Serving

```javascript
// Create multi-model preset
await stateManager.request("presets:create", { filename: "multi" });

// Set global defaults
await stateManager.request("presets:update-defaults", {
  filename: "multi",
  config: {
    "ctx-size": 4096,
    "n-gpu-layers": 30,
    "threads": 8
  }
});

// Add multiple models
const models = [
  { name: "llama2-7b", path: "/models/llama2-7b.gguf", temp: 0.7 },
  { name: "mistral-7b", path: "/models/mistral-7b.gguf", temp: 0.5 },
  { name: "neural-chat", path: "/models/neural-chat.gguf", temp: 0.8 }
];

for (const model of models) {
  await stateManager.request("presets:add-model", {
    filename: "multi",
    modelName: model.name,
    config: {
      model: model.path,
      temperature: model.temp
    }
  });
}

// Launch all models
await stateManager.request("presets:start-with-preset", {
  filename: "multi",
  options: { maxModels: 6 }
});
```

## API Summary

### Two Main Events

**Start Server**
```javascript
stateManager.request("presets:start-with-preset", {
  filename: string,        // Preset name
  options?: {
    maxModels?: number;   // Default: 4
    threads?: number;     // Default: 4
    ctxSize?: number;     // Default: 4096
  }
})
```

**Stop Server**
```javascript
stateManager.request("presets:stop-server")
```

## File Structure

```
/config/                    # Preset storage
├── test.ini              # INI file format
├── dev.ini
├── prod.ini
└── multi.ini

Format:
LLAMA_CONFIG_VERSION = 1

[*]
ctx-size = 4096
threads = 8

[model-name]
model = /path/to/model.gguf
temperature = 0.7
```

## Troubleshooting

### "Preset file not found"
```bash
# Check preset exists
ls -la ./config/your-preset.ini

# Create it first
curl -X POST http://localhost:3000 \
  -d '{"event": "presets:create", "data": {"filename": "your-preset"}}'
```

### "llama-server binary not found"
```bash
# Install llama.cpp or add to PATH
which llama-server
# If not found, download from: https://github.com/ggerganov/llama.cpp
```

### "Port already in use"
System automatically finds next available port. Check response:
```javascript
const port = response.data.port;  // Use this port, not 8080
```

### "Model file not found"
Update preset with correct path:
```javascript
await stateManager.request("presets:update-model", {
  filename: "test",
  modelName: "my-model",
  config: {
    model: "/absolute/path/to/model.gguf"  // Must be absolute path
  }
});
```

## Frontend Integration (Optional)

Add button to Presets page UI:

```html
<button onclick="launchServer()">🚀 Launch Server</button>
<button onclick="stopServer()">⏹ Stop Server</button>
```

```javascript
async function launchServer() {
  const response = await stateManager.request("presets:start-with-preset", {
    filename: prompt("Preset name:"),
    options: { maxModels: 4 }
  });
  if (response.success) {
    alert(`Server on port ${response.data.port}`);
  }
}

async function stopServer() {
  const response = await stateManager.request("presets:stop-server");
  if (response.success) alert("Server stopped");
}
```

## Complete Workflow

```
1. Create preset
   stateManager.request("presets:create", {filename: "mypreset"})

2. Add models
   stateManager.request("presets:add-model", {...})

3. Save preset
   stateManager.request("presets:save", {...})

4. Launch
   stateManager.request("presets:start-with-preset", {filename: "mypreset"})

5. Monitor
   curl http://localhost:PORT/models

6. Stop
   stateManager.request("presets:stop-server")
```

## Command-Line Alternative

Still want CLI? Presets can be used directly:

```bash
# Use preset file manually
llama-server \
  --models-preset ./config/my-preset.ini \
  --models-max 4 \
  --port 8080
```

## Getting Help

- 📖 [PRESETS_LAUNCH_SUMMARY.md](PRESETS_LAUNCH_SUMMARY.md) - Full overview
- 🔌 [PRESETS_LAUNCH_API.md](PRESETS_LAUNCH_API.md) - Complete API reference
- 💻 [PRESETS_LAUNCH_EXAMPLE.md](PRESETS_LAUNCH_EXAMPLE.md) - Frontend code examples
- 📚 [AGENTS.md](AGENTS.md) - Project guidelines

## Status

✅ **Backend**: Fully implemented and tested  
⏳ **Frontend**: Optional, see examples for implementation  
🚀 **Ready to Use**: Yes

---

**Last Updated**: January 2026  
**Version**: 1.0
