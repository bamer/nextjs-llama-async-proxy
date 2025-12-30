# Configuration Quick Reference - Next.js Llama Async Proxy

Quick reference guide for configuration management in Next.js Llama Async Proxy.

## Table of Contents

- [Configuration Files](#configuration-files)
- [Llama Server Configuration](#llama-server-configuration)
- [Model Templates Configuration](#model-templates-configuration)
- [Logger Configuration](#logger-configuration)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)

---

## Configuration Files

### Primary Configuration Files

```
llama-server-config.json       # Llama server settings (API-managed)
src/config/model-templates.json # Model templates (API-managed)
.env.local                    # Environment variables (optional)
```

### Configuration Storage Locations

| Configuration | Location | Management Method |
|---------------|----------|------------------|
| **Llama Server** | `llama-server-config.json` | API endpoints (GET/POST /api/config) |
| **Model Templates** | `src/config/model-templates.json` | API endpoints (GET/POST /api/model-templates) |
| **Environment** | `.env.local` | Environment variables (optional) |
| **Database** | `./data/llama-dashboard.db` | SQLite database (auto-created) |
| **Logs** | `./logs/` directory | Winston auto-rotation |

**Important**: All configuration changes should go through API endpoints, not direct file editing. The Settings page uses API for all configuration operations.

---

## Llama Server Configuration

### Configuration File: `llama-server-config.json`

```json
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/path/to/your/models",
  "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

### Configuration Fields

| Field | Type | Default | Description |
|--------|-------|----------|-------------|
| `host` | string | "localhost" | Llama server host address |
| `port` | number | 8134 | Llama server port |
| `basePath` | string | required | Directory containing GGUF model files |
| `serverPath` | string | required | Full path to llama-server binary |
| `ctx_size` | number | 8192 | Context window size (tokens) |
| `batch_size` | number | 512 | Processing batch size |
| `threads` | number | -1 | CPU threads (-1 for auto) |
| `gpu_layers` | number | -1 | GPU layers to offload (-1 for all) |

### API Endpoints

#### GET /api/config

Retrieve current configuration.

```bash
curl http://localhost:3000/api/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "host": "localhost",
    "port": 8134,
    "basePath": "/path/to/models",
    "serverPath": "/path/to/llama-server",
    "ctx_size": 8192,
    "batch_size": 512,
    "threads": -1,
    "gpu_layers": -1
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

#### POST /api/config

Update configuration.

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "host": "localhost",
    "port": 8134,
    "basePath": "/path/to/models",
    "serverPath": "/path/to/llama-server",
    "ctx_size": 8192,
    "batch_size": 512,
    "threads": -1,
    "gpu_layers": -1
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "data": { /* config object */ },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

**Note**: Changes to `llama-server-config.json` require server restart to take effect.

### TypeScript Interface

```typescript
export interface LlamaServerConfig {
  host: string;
  port: number;
  basePath: string;
  serverPath: string;
  ctx_size: number;
  batch_size: number;
  threads: number;
  gpu_layers: number;
}
```

---

## Model Templates Configuration

### Configuration File: `src/config/model-templates.json`

```json
{
  "default_model": null,
  "model_templates": {
    "llama2-7b": "llama-2-7b-chat",
    "mistral-7b": "mistral-7b-instruct",
    "custom-model": "custom-template"
  }
}
```

### Configuration Structure

| Field | Type | Description |
|--------|-------|-------------|
| `default_model` | string \| null | Default template to use (null if none) |
| `model_templates` | Record<string, string> | Mapping of model names to template names |

### API Endpoints

#### GET /api/model-templates

Retrieve model templates.

```bash
curl http://localhost:3000/api/model-templates
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model_templates": {
      "llama2-7b": "llama-2-7b-chat",
      "mistral-7b": "mistral-7b-instruct"
    },
    "default_model": null
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

**Features:**
- In-memory caching (0ms disk I/O for repeated requests)
- Automatic cache invalidation on save
- Zod validation for data integrity

#### POST /api/model-templates

Save model templates.

```bash
curl -X POST http://localhost:3000/api/model-templates \
  -H "Content-Type: application/json" \
  -d '{
    "model_templates": {
      "llama2-7b": "llama-2-7b-chat",
      "mistral-7b": "mistral-7b-instruct"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model_templates": {
      "llama2-7b": "llama-2-7b-chat",
      "mistral-7b": "mistral-7b-instruct"
    }
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

### TypeScript Interfaces

```typescript
interface ModelTemplatesConfig {
  model_templates: Record<string, string>;
  default_model?: string | null;
}

interface ModelTemplateSaveRequest {
  model_templates: Record<string, string>;
}
```

### Zod Schemas

```typescript
const modelTemplatesConfigSchema = z.object({
  model_templates: z.record(z.string()),
  default_model: z.string().nullable().optional()
});

const modelTemplateSaveRequestSchema = z.object({
  model_templates: z.record(z.string())
});
```

### Client Library Usage

```typescript
import {
  loadModelTemplates,
  saveModelTemplate,
  getModelTemplate,
  getModelTemplates
} from '@/lib/model-templates';

// Load all templates
const templates = await loadModelTemplates();

// Get template for specific model
const template = await getModelTemplate('llama-2-7b');

// Save new template
await saveModelTemplate('mistral-7b', 'chat-template');

// Get all templates (with caching)
const allTemplates = await getModelTemplates();
```

---

## Logger Configuration

### Logger System: Winston 3.19.0

Winston is configured with multiple transports for different use cases.

### Log Levels

| Level | Usage | Example |
|--------|---------|----------|
| `error` | Critical errors and failures | `logger.error("Failed to load model", { error })` |
| `warn` | Warning messages | `logger.warn("High memory usage: %d%%", 90)` |
| `info` | General informational messages | `logger.info("Server started", { port: 3000 })` |
| `debug` | Detailed debugging information | `logger.debug("Debug details: %o", { data })` |

### Transports

#### 1. Console Transport

- Colorized terminal output
- Timestamp and log level
- Development and production
- Format: `[LEVEL] [timestamp] message`

#### 2. File Transport

- Daily rotation: `logs/application-YYYY-MM-DD.log`
- All log levels
- JSON format for parsing
- Configurable retention

#### 3. Error File Transport

- Daily rotation: `logs/errors-YYYY-MM-DD.log`
- Error and warning levels only
- Easier debugging and issue tracking
- JSON format

#### 4. WebSocket Transport

- Real-time streaming to UI
- Batches messages for efficiency
- Filters by user preferences
- Delivered via Socket.IO

### API Endpoint

#### GET /api/logger/config

Retrieve current logger configuration.

```bash
curl http://localhost:3000/api/logger/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "level": "info",
    "colors": true,
    "verbose": false,
    "dailyRotation": true,
    "maxFiles": "30d"
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

**Configuration Fields:**
| Field | Type | Default | Description |
|--------|-------|----------|-------------|
| `level` | string | "info" | Minimum log level (debug, info, warn, error) |
| `colors` | boolean | true | Enable colorized console output |
| `verbose` | boolean | false | Include debug information |
| `dailyRotation` | boolean | true | Enable daily log rotation |
| `maxFiles` | string | "30d" | Log retention period (e.g., "30d" for 30 days) |

### Usage Pattern

```typescript
import { getLogger } from '@/lib/logger';

const logger = getLogger();

// Server-side logging
logger.info('Server started', { port: 3000 });
logger.error('Failed to connect to database', { error: err });
logger.warn('High memory usage', { usage: '90%' });
logger.debug('Detailed debug information', { data: { /* ... */ } });

// Client-side uses console (not Winston logger)
console.log('Client message');
```

### Real-time Log Streaming

Logs are streamed to UI in real-time via WebSocket:

```typescript
// Client receives logs every 15 seconds
socket.on('logs_update', (data) => {
  data.logs.forEach(log => {
    console.log(`[${log.level}] ${log.message}`);
  });
});
```

### Log File Locations

```
logs/application-YYYY-MM-DD.log    # All logs
logs/errors-YYYY-MM-DD.log         # Error and warning logs only
```

### Log Retention

- **Automatic Daily Rotation**: New log file created each day at midnight
- **Configurable Retention**: Default 30 days retention
- **Automatic Cleanup**: Old log files automatically deleted
- **Separate Error Logs**: Error logs kept separately for easier access

---

## Environment Variables

### Optional Configuration via `.env.local`

Create `.env.local` in project root:

```env
# Application Settings
NODE_ENV=development
PORT=3000

# WebSocket Settings
WEBSOCKET_PATH=/llamaproxws

# Development Settings
METRICS_INTERVAL=10000
MODELS_INTERVAL=30000
LOGS_INTERVAL=15000

# Logging
LOG_LEVEL=debug
LOG_COLORS=true
LOG_VERBOSE=true
```

### Environment Variable Reference

| Variable | Default | Description |
|----------|----------|-------------|
| `NODE_ENV` | "development" | Application environment (development, production) |
| `PORT` | 3000 | Server port |
| `WEBSOCKET_PATH` | "/llamaproxws" | WebSocket path |
| `METRICS_INTERVAL` | 10000 | Metrics update interval (ms) |
| `MODELS_INTERVAL` | 30000 | Models update interval (ms) |
| `LOGS_INTERVAL` | 15000 | Logs update interval (ms) |
| `LOG_LEVEL` | "info" | Minimum log level |
| `LOG_COLORS` | true | Enable colorized console output |
| `LOG_VERBOSE` | false | Include debug information |

---

## API Endpoints Summary

### Configuration Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/config` | Get llama-server configuration |
| POST | `/api/config` | Update llama-server configuration |
| GET | `/api/model-templates` | Get model templates |
| POST | `/api/model-templates` | Save model templates |
| GET | `/api/logger/config` | Get logger configuration |

### Model Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/models` | List registered models |
| POST | `/api/models` | Register new models |
| POST | `/api/models/discover` | Discover models from directories |
| DELETE | `/api/models/:id` | Remove a model |

### Health Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | Detailed system status |

### Monitoring Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/monitoring` | Current system metrics |
| GET | `/api/monitoring/history` | Historical performance metrics |

---

## Database Configuration

### Database File: `./data/llama-dashboard.db`

The database uses normalized schema v2.0 with specialized tables.

### Key Tables

| Table | Purpose | Fields |
|--------|-----------|---------|
| `models` | Core model data | 26 fields |
| `model_sampling_config` | Sampling parameters | 36 fields |
| `model_memory_config` | Memory settings | 8 fields |
| `model_gpu_config` | GPU configuration | 10 fields |
| `model_advanced_config` | Advanced options | 22 fields |
| `model_lora_config` | LoRA adapters | 21 fields |
| `model_multimodal_config` | Multimodal settings | 7 fields |
| `model_server_config` | Global server defaults | 38 fields |
| `metrics_history` | Last 10 minutes of metrics | 13 fields |
| `metadata` | Dashboard global state | 3 fields |

### Database Features

- **Cascade Delete**: Deleting a model removes all related configs automatically
- **Independent Server Config**: Global settings persist regardless of models
- **Auto Cleanup**: Metrics older than 10 minutes removed automatically
- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Indexes**: Optimized lookups on model name, status, type

---

## Configuration Best Practices

### 1. Always Use API Endpoints

✅ **Recommended**: Use API endpoints for all configuration changes

```typescript
// Good - use API
await apiService.updateConfig(newConfig);
await saveModelTemplate('model-name', 'template');
```

❌ **Avoid**: Direct file manipulation

```javascript
// Bad - direct file access
fs.writeFileSync('llama-server-config.json', JSON.stringify(config));
```

**Reason**: API provides validation, error handling, and type safety.

### 2. Validate Configuration Before Saving

```typescript
import { validateConfig } from '@/lib/server-config';

const validation = validateConfig(newConfig);
if (!validation.valid) {
  console.error('Invalid config:', validation.errors);
  return;
}

await apiService.updateConfig(newConfig);
```

### 3. Backup Configuration Before Major Changes

```bash
# Backup llama-server configuration
cp llama-server-config.json llama-server-config.json.backup

# Backup model templates
cp src/config/model-templates.json src/config/model-templates.json.backup
```

### 4. Test Configuration Changes

```bash
# Update configuration via Settings page
# Restart server
pnpm dev

# Monitor logs for errors
tail -f logs/application-$(date +%Y-%m-%d).log
```

### 5. Use Appropriate Configuration Values

**Context Size**:
- Small models: 2048-4096
- Medium models: 4096-8192
- Large models: 8192-32768

**GPU Layers**:
- CPU-only: 0
- Mixed: 10-35 (depending on GPU memory)
- Full GPU: -1 (all layers)

**Batch Size**:
- Fast inference: 512
- Balanced: 256-512
- Quality over speed: 128-256

---

## Troubleshooting Configuration

### Configuration Not Loading

**Symptoms**: Settings page shows incorrect or missing configuration

**Solutions**:
1. Verify `llama-server-config.json` exists in project root
2. Check file permissions for reading/writing
3. Verify JSON syntax is valid
4. Check API endpoint is accessible: `curl http://localhost:3000/api/config`
5. Review server logs for error messages

### Configuration Not Saving

**Symptoms**: Changes in Settings page don't persist

**Solutions**:
1. Check server logs for write errors
2. Verify file permissions allow writing
3. Ensure disk space is available
4. Check API response for errors
5. Verify JSON serialization is correct

### Model Templates Not Loading

**Symptoms**: Template dropdown doesn't show available templates

**Solutions**:
1. Check `src/config/model-templates.json` exists
2. Verify file format is correct JSON
3. Check API endpoint: `curl http://localhost:3000/api/model-templates`
4. Review browser console for client errors
5. Verify Zod validation is passing

### Logs Not Writing

**Symptoms**: No log files in `logs/` directory

**Solutions**:
1. Create `logs/` directory if it doesn't exist
2. Check write permissions on `logs/` directory
3. Verify Winston transport configuration
4. Review server startup logs for initialization errors
5. Check environment variables for log level settings

---

**Configuration Quick Reference - Next.js Llama Async Proxy**
**Version 0.2.0 - December 30, 2025**
