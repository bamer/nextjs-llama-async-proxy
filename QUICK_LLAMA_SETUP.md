# Quick Llama Setup (5 Minutes)

## 1. Configuration File

Create `.llama-proxy-config.json` in project root:

```json
{
  "llama_server_host": "localhost",
  "llama_server_port": 8134,
  "llama_server_path": "/home/bamer/llama.cpp/build/bin/llama-server",
  "basePath": "./models"
}
```

Replace the `llama_server_path` with your actual path.

## 2. Models Directory

```bash
# Create models folder
mkdir -p ./models

# Copy your GGUF files
cp /path/to/your/model.gguf ./models/

# Verify
ls -lh ./models/
# Should show: model.gguf (X.XX GB)
```

## 3. Start Application

```bash
pnpm install    # First time only
pnpm dev        # Start development server
```

## 4. What You Should See

In the console output:
```
✅ [CONFIG] Llama config loaded from .llama-proxy-config.json
🚀 [LLAMA] Starting Llama service...
🚀 Spawning llama-server with args: --host localhost --port 8134 --models-dir ./models
✅ Server ready after X checks
🔍 Querying llama-server for available models...
✅ Loaded 1 model(s) from llama-server
  - model.gguf (7.25 GB)
```

## 5. Open in Browser

Visit: [http://localhost:3000](http://localhost:3000)

Go to **Models** page → See your model listed

## 6. Common Issues

### "No models found"
```bash
ls -lh ./models/        # Check files exist
file ./models/*.gguf    # Verify they're GGUF files
```

### "llama-server not found"
```bash
which llama-server
# If empty, update llama_server_path in .llama-proxy-config.json
```

### "Port 8134 already in use"
```bash
# Change port in config file
echo '{"llama_server_port": 8135}' >> .llama-proxy-config.json
```

---

## Full Documentation

- 📖 [Complete Setup Guide](LLAMA_STARTUP_GUIDE.md)
- 🔧 [Configuration Options](CONFIGURATION.md)
- 📋 [What Changed](LLAMA_STARTUP_FIX_SUMMARY.md)
