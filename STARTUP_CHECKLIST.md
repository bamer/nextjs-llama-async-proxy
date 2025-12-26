# Llama Startup Checklist

## Pre-Startup ✓

- [ ] Node.js 18+ installed: `node --version`
- [ ] pnpm 9+ installed: `pnpm --version`
- [ ] llama-server binary available: `which llama-server`
- [ ] Models directory created: `mkdir -p ./models`
- [ ] GGUF files in `./models`: `ls -lh ./models/*.gguf`

## Configuration ✓

Create `.llama-proxy-config.json`:

```json
{
  "llama_server_host": "localhost",
  "llama_server_port": 8134,
  "llama_server_path": "$(which llama-server)",
  "basePath": "./models"
}
```

- [ ] File created in project root
- [ ] `llama_server_path` is correct (from `which llama-server`)
- [ ] `basePath` matches where your GGUF files are
- [ ] No `llama_model_path` field (should be removed if present)

## Installation ✓

```bash
pnpm install
```

- [ ] Dependencies installed without errors
- [ ] `node_modules` directory exists

## Startup ✓

```bash
pnpm dev
```

Watch for these messages:

- [ ] `✅ [CONFIG] Llama config loaded from .llama-proxy-config.json`
- [ ] `🚀 [LLAMA] Starting Llama service...`
- [ ] `🚀 Spawning llama-server with args: --host localhost --port 8134 --models-dir ./models`
  - **IMPORTANT**: Must say `--models-dir` (NOT `--model-dir`)
- [ ] `✅ Server ready after X checks`
- [ ] `🔍 Querying llama-server for available models...`
- [ ] `✅ Loaded X model(s) from llama-server`
  - Should show list: `- model.gguf (X.XX GB)`
- [ ] `Ready on http://localhost:3000`

## Verification ✓

In another terminal:

```bash
# Test 1: Server health
curl http://localhost:8134/health
# Expected: 200 OK
- [ ] Returns HTTP 200

# Test 2: List models
curl http://localhost:8134/api/models
# Expected: JSON array with your models
- [ ] Returns model list

# Test 3: Web UI
open http://localhost:3000
- [ ] Opens in browser
- [ ] Models page shows discovered models
- [ ] Can select a model without errors
```

## Success! ✓

All checks passed:
- [ ] Application started without crashes
- [ ] llama-server discovered models automatically
- [ ] Web UI displays models
- [ ] No error messages in logs

## Troubleshooting

### If startup fails, check:

#### 1. Configuration file
```bash
cat .llama-proxy-config.json | jq .
# Verify paths are correct
```

#### 2. Binary exists
```bash
which llama-server
file $(which llama-server)
# Should show executable path
```

#### 3. Models exist
```bash
ls -lh ./models/
file ./models/*.gguf
# Should show GGUF files
```

#### 4. Port available
```bash
lsof -i :8134
# If shows llama-server, that's OK (means it's running)
# If shows something else, change port in config
```

#### 5. Permissions
```bash
# Ensure executable
chmod +x $(which llama-server)
# Ensure readable models
chmod 644 ./models/*.gguf
```

## Quick Debug Commands

```bash
# View detailed startup logs
pnpm dev 2>&1 | grep -E "(llama|Llama|model|Model)"

# Test llama-server directly
llama-server --host localhost --port 8134 --models-dir ./models

# Check processes
ps aux | grep llama

# Kill stuck process
pkill llama-server

# Test connectivity
curl -v http://localhost:8134/health
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `invalid argument: --model-dir` | Wrong argument name | Use `--models-dir` (already fixed) |
| `Connection refused` | Port in use | Change `llama_server_port` in config |
| `No such file or directory` | Binary not found | Fix `llama_server_path` in config |
| `No models found` | Directory empty or wrong | Check `basePath` and `ls ./models/` |
| `EADDRINUSE` | Port 3000 in use | Kill process or change `PORT` env var |

## Next Steps After Startup

1. Open [http://localhost:3000](http://localhost:3000)
2. Go to **Models** page
3. See your discovered models
4. Click a model to load it
5. Make inference requests
6. Check **Logs** page for activity
7. Monitor on **Dashboard**

## Reference Documents

- 📖 [Quick Setup - 5 minutes](QUICK_LLAMA_SETUP.md)
- 📚 [Full Guide](LLAMA_STARTUP_GUIDE.md)
- 📋 [Command Reference](LLAMA_COMMAND_REFERENCE.md)
- 🔄 [Startup Flow Diagrams](STARTUP_FLOW.md)
- 🔧 [Configuration Details](CONFIGURATION.md)

---

**Status**: Ready for startup
**Last Updated**: 2025-12-26
**Version**: 1.0 (Corrected)
