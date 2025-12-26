# Application Startup Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Your Computer                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │         Node.js Process (Port 3000)                         │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  Next.js Server                                      │  │   │
│  │  │  - React Components                                  │  │   │
│  │  │  - API Routes                                        │  │   │
│  │  │  - Socket.IO Server                                  │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │           │                                                 │   │
│  │           │ HTTP + WebSocket                               │   │
│  │           │ Proxy Requests                                 │   │
│  │           ▼                                                 │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  LlamaService (TypeScript)                           │  │   │
│  │  │  - Manages llama-server process                      │  │   │
│  │  │  - Health checks                                     │  │   │
│  │  │  - Model discovery                                   │  │   │
│  │  │  - Retry logic                                       │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │           │                                                 │   │
│  │           │ Spawns (if needed) / Communicates             │   │
│  │           ▼                                                 │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  llama-server Process (Port 8134)                    │  │   │
│  │  │  - HTTP API Server                                   │  │   │
│  │  │  - Model Loading & Inference                         │  │   │
│  │  │  - /api/models - List available models              │  │   │
│  │  │  - /health - Health endpoint                         │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │           │                                                 │   │
│  │           │ Reads GGUF files                              │   │
│  │           ▼                                                 │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  File System: ./models directory                     │  │   │
│  │  │  - model1.gguf (7.25 GB)                             │  │   │
│  │  │  - model2.gguf (4.50 GB)                             │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                                                         │
│           │ Browser                                                 │
│           ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  http://localhost:3000 (Web UI)                             │   │
│  │  - Dashboard                                                │   │
│  │  - Models Page                                              │   │
│  │  - Logs                                                     │   │
│  │  - Settings                                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Startup Sequence (Detailed)

### Phase 1: Application Boot (0-2s)

```
┌─ pnpm dev ────────────────────────────────────────┐
│                                                   │
│ 1. Node.js process starts                         │
│ 2. Load server.js                                 │
│ 3. Initialize Next.js app                         │
│ 4. Read .llama-proxy-config.json                  │
│ 5. Create LlamaService instance                   │
│ 6. Setup Socket.IO server on port 3000            │
│                                                   │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
         ✅ "Next.js app prepared"
```

### Phase 2: Llama Service Start (2-5s)

```
┌─ llamaService.start() ──────────────────────────┐
│                                                 │
│ 1. Check if llama-server already running        │
│    └─ Health check: GET /health on :8134        │
│                                                 │
│  IS RUNNING?                                    │
│  ├─ YES: Skip to Phase 3                        │
│  └─ NO: Continue                                │
│                                                 │
│ 2. Spawn new llama-server process               │
│    └─ Command:                                  │
│       /path/to/llama-server \                   │
│         --host localhost \                      │
│         --port 8134 \                           │
│         --models-dir ./models                    │
│                                                 │
│ 3. Set up stdio handlers                        │
│    ├─ stdout: Log debug messages                │
│    └─ stderr: Log warnings/errors               │
│                                                 │
│ 4. Wait for readiness                           │
│    └─ Poll /health endpoint (max 60 checks)     │
│       Once: HTTP 200 → continue                 │
│                                                 │
└─────────────────────────────────────────────────┘
                     │
                     ▼
   ✅ "llama-server is ready"
```

### Phase 3: Model Discovery (5-10s)

```
┌─ loadModels() ──────────────────────────────────┐
│                                                 │
│ 1. Query llama-server for available models      │
│    └─ GET http://localhost:8134/api/models     │
│                                                 │
│ 2. Parse response                               │
│    ├─ Server auto-discovers ./models/*.gguf    │
│    └─ Returns JSON array of model metadata      │
│                                                 │
│ 3. Store in LlamaService.state.models           │
│                                                 │
│ 4. Log each discovered model                    │
│    └─ "- model1.gguf (7.25 GB)"                 │
│                                                 │
│ 5. Emit state change to Socket.IO clients       │
│    └─ Broadcast via 'llamaStatus' event         │
│                                                 │
└─────────────────────────────────────────────────┘
                     │
                     ▼
✅ "Loaded 1 model(s) from llama-server"
```

### Phase 4: Ready for Connections (10+s)

```
┌─ Socket.IO Server Ready ───────────────────────┐
│                                                 │
│ 1. Application fully started                    │
│ 2. Listening on http://localhost:3000           │
│ 3. Browser can connect                          │
│ 4. Models list available in Models page         │
│ 5. User can select & load models                │
│                                                 │
│ WebSocket Events Available:                     │
│ ├─ 'metrics' - Performance data                 │
│ ├─ 'models' - Available models                  │
│ ├─ 'logs' - System logs                         │
│ └─ 'llamaStatus' - Llama server status          │
│                                                 │
└─────────────────────────────────────────────────┘
```

## State Machine: LlamaService

```
                    ┌──────────────┐
                    │   initial    │
                    └────────┬─────┘
                             │ .start()
                             ▼
                    ┌──────────────┐
                 ┌─▶│   starting   │◀─────────────────┐
                 │  └────────┬─────┘                  │
                 │           │                        │
                 │      Check health                  │
                 │           │                        │
              Crash     ┌─────┴─────┐               Retry
                 │      │           │ Already running
                 │    YES│        NO│
                 │      ▼           ▼
            ┌─────────────────────────────┐
            │   Spawn server process      │
            └──────┬──────────────────────┘
                   │
              Wait for /health
                   │
              ┌────┴────┐
              │          │
           OK │          │ Timeout
              ▼          ▼
         ┌────────────────────┐
         │    loadModels()    │
         └────────┬───────────┘
                  │
          ┌───────┴────────┐
          │ Models found?  │
          ├──YES──────NO───┤
          ▼                ▼
       ┌────────┐   ┌──────────┐
       │ ready  │   │ warning  │
       │(return)│   │(continue)│
       └────────┘   └──────────┘
            │            │
            └─────┬──────┘
                  │
                ready state
```

## Model Loading Flow

```
┌─ User selects model in UI ─────────────────────┐
│                                                 │
│ Browser Action:                                 │
│ Click: "Load model1.gguf"                       │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─ Socket.IO emits 'loadModel' ──────────────────┐
│                                                 │
│ {"modelId": "model1.gguf"}                      │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─ Server receives, proxies to llama-server ─────┐
│                                                 │
│ POST /api/models/model1.gguf/load               │
│ or appropriate llama-server endpoint            │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─ llama-server loads GGUF file ─────────────────┐
│                                                 │
│ 1. Load from ./models/model1.gguf               │
│ 2. Initialize model in memory                   │
│ 3. Ready for inference                          │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─ Server broadcasts status update ───────────────┐
│                                                 │
│ Socket.IO 'llamaStatus' event:                  │
│ {                                               │
│   "status": "ready",                            │
│   "models": [...],                              │
│   "currentModel": "model1.gguf"                 │
│ }                                               │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─ UI updates ──────────────────────────────────────┐
│                                                   │
│ Models page shows:                                │
│ ✅ model1.gguf (LOADED)                           │
│                                                   │
│ User can now:                                     │
│ - Make inference requests                         │
│ - View model stats                                │
│ - Switch to different model                       │
│                                                   │
└───────────────────────────────────────────────────┘
```

## Configuration Impact on Startup

```
┌─ .llama-proxy-config.json ──────────────────────────────────┐
│                                                              │
│ {                                                            │
│   "llama_server_host": "localhost",                          │
│   ├─ Affects: Where to connect/listen                       │
│   │ Usage: --host {this value}                              │
│   │                                                          │
│   "llama_server_port": 8134,                                 │
│   ├─ Affects: Which port llama-server listens on            │
│   │ Usage: --port {this value}                              │
│   │                                                          │
│   "llama_server_path": "/path/to/llama-server",             │
│   ├─ Affects: Which binary to spawn                         │
│   │ Usage: Executable in spawn() call                       │
│   │                                                          │
│   "basePath": "./models",                                    │
│   ├─ Affects: Where models are auto-discovered              │
│   │ Usage: --models-dir {this value}                         │
│   │ IMPORTANT: Models are discovered here at startup        │
│   │                                                          │
│   "ctx_size": 2048,  [OPTIONAL]                              │
│   "gpu_layers": 32,  [OPTIONAL]                              │
│   ... other config options                                   │
│ }                                                            │
│                                                              │
│ ❌ DO NOT include: "llama_model_path"                         │
│    This caused startup crashes by trying to load             │
│    a specific model that might not exist                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Troubleshooting Flowchart

```
              Application starts
                     │
                     ▼
         Does .llama-proxy-config.json exist?
                  │          │
              YES │          │ NO
                  ▼          ▼
              Load it    Use defaults
                  │          │
                  └────┬─────┘
                       ▼
           Initialize LlamaService
                       │
                       ▼
         Is llama-server already running?
            (Check /health endpoint)
                  │          │
              YES │          │ NO
                  │          ▼
                  │    Spawn new process
                  │          │
                  │          ▼
                  │   Poll /health (max 60s)
                  │          │
                  │    ┌─────┴────┐
                  │    │          │
                  │ OK │          │ TIMEOUT
                  │    │          │
                  │    ▼          ▼
                  │  Success  CRASH
                  │                │
                  └────┬───────────┘
                       ▼
            Query /api/models endpoint
                       │
         ┌─────────────┴─────────────┐
         │ Models found?              │
      YES│                         NO │
         ▼                            ▼
    Display in UI         Check basePath exists
         │                 Check *.gguf files
         │                 Update config
         ▼                            │
    ✅ READY                          ▼
                              ⚠️ WARNING
```

---

## Key Times

- **Total startup**: 10-30 seconds (depends on hardware)
- **Phase 1 (boot)**: 1-2 seconds
- **Phase 2 (llama-server start)**: 2-10 seconds
- **Phase 3 (model discovery)**: <1 second
- **Phase 4 (ready)**: Immediate after phase 3

## Performance Optimization Tips

1. **Keep ./models on SSD** - Faster file discovery
2. **Have models ready before startup** - No delay in discovery
3. **Use --gpu-layers in config** - Faster inference
4. **Set appropriate context size** - Balance between speed/quality
