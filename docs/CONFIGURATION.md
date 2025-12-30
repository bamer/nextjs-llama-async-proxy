# Configuration Guide - Next.js Llama Async Proxy

Complete configuration guide for Next.js Llama Async Proxy, covering all configuration options, environment variables, and tuning parameters.

## Table of Contents

- [Overview](#overview)
- [Configuration Files](#configuration-files)
- [Llama Server Configuration](#llama-server-configuration)
- [Model Templates Configuration](#model-templates-configuration)
- [Logger Configuration](#logger-configuration)
- [Environment Variables](#environment-variables)
- [Database Configuration](#database-configuration)
- [Performance Tuning](#performance-tuning)
- [Security Configuration](#security-configuration)
- [Configuration Best Practices](#configuration-best-practices)
- [Troubleshooting Configuration](#troubleshooting-configuration)

---

## Overview

Next.js Llama Async Proxy uses a multi-layered configuration system:

1. **File-based configuration**: JSON files for persistent settings
2. **Environment variables**: Optional runtime configuration
3. **Database configuration**: Dynamic settings stored in SQLite
4. **API-based management**: All configuration changes go through API endpoints

### Configuration Architecture

```
Configuration Sources
│
├── llama-server-config.json      # Llama server settings (API-managed)
├── src/config/model-templates.json # Model templates (API-managed)
├── .env.local / .env.production  # Environment variables (optional)
└── data/llama-dashboard.db       # Database configuration (auto-created)
```

### Configuration Management Principle

**Important**: All configuration changes should go through API endpoints, not direct file editing.

- ✅ **Use Settings page** - Web interface for configuration
- ✅ **Use API endpoints** - Programmatic configuration
- ❌ **Avoid direct file editing** - Bypasses validation and error handling

---

## Configuration Files

### Primary Configuration Files

| File | Purpose | Management | Required |
|------|---------|------------|----------|
| `llama-server-config.json` | Llama server settings | API endpoints | Yes |
| `src/config/model-templates.json` | Model prompt templates | API endpoints | No |
| `.env.local` | Environment variables | Direct editing | No |
| `data/llama-dashboard.db` | Database configuration | Auto-created | Auto |

### File Locations

```
Project Root
├── llama-server-config.json       # Llama server configuration
├── .env.local                    # Environment variables (development)
├── .env.production               # Environment variables (production)
├── data/
│   └── llama-dashboard.db       # SQLite database (auto-created)
└── src/
    └── config/
        └── model-templates.json # Model templates
```

---

## Llama Server Configuration

### Configuration File: `llama-server-config.json`

```json
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/path/to/your/models",
  "serverPath": "/home/user/llama.cpp/build/bin/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

### Configuration Fields

| Field | Type | Default | Range | Description |
|--------|-------|----------|--------|-------------|
| `host` | string | "localhost" | hostname/IP | Llama server host address |
| `port` | number | 8134 | 1-65535 | Llama server port |
| `basePath` | string | required | path | Directory containing GGUF model files |
| `serverPath` | string | required | path | Full path to llama-server binary |
| `ctx_size` | number | 8192 | 512-32768 | Context window size (tokens) |
| `batch_size` | number | 512 | 1-512 | Processing batch size |
| `threads` | number | -1 | -1, 1-64 | CPU threads (-1 for auto) |
| `gpu_layers` | number | -1 | -1, 0-100 | GPU layers to offload (-1 for all) |

### Field Descriptions

#### `host`
- **Purpose**: Hostname or IP address where llama-server runs
- **Common values**:
  - `localhost` - Local development
  - `0.0.0.0` - Listen on all interfaces
  - `192.168.1.100` - Specific network IP
- **Use case**: When llama-server runs on different machine

#### `port`
- **Purpose**: Port number for llama-server
- **Default**: 8134 (llama.cpp default)
- **Common ports**:
  - `8134` - Default llama.cpp port
  - `8080` - Alternative common port
  - Custom port for running multiple instances
- **Use case**: When default port is in use

#### `basePath`
- **Purpose**: Directory containing GGUF model files
- **Required**: Yes
- **Example**: `/media/bamer/crucial MX300/llm/llama/models`
- **Requirements**:
  - Absolute or relative path
  - Readable by application
  - Contains `.gguf` or `.bin` files
- **Use case**: Point to your model storage directory

#### `serverPath`
- **Purpose**: Full path to llama-server binary
- **Required**: Yes
- **Example**: `/home/bamer/llama.cpp/build/bin/llama-server`
- **Requirements**:
  - Absolute path recommended
  - Executable file
  - Built for your system architecture
- **Use case**: Point to compiled llama-server binary

#### `ctx_size` (Context Size)
- **Purpose**: Maximum context window size in tokens
- **Default**: 8192 tokens
- **Recommendations**:
  - **Short conversations**: 2048-4096
  - **Medium conversations**: 4096-8192
  - **Long conversations**: 8192-16384
  - **Document analysis**: 16384-32768
- **Impact**:
  - Higher values require more memory
  - Trade-off: context length vs memory usage
  - Affects VRAM/GPU memory requirements
- **Use case**: Adjust based on your use case

#### `batch_size`
- **Purpose**: Number of tokens processed at once
- **Default**: 512
- **Range**: 1-512
- **Recommendations**:
  - **Fast inference**: 512 (maximum)
  - **Balanced**: 256-512
  - **Quality focus**: 128-256
- **Impact**:
  - Larger batches = faster processing but more memory
  - Smaller batches = lower memory but slower
- **Use case**: Tune based on available memory and performance needs

#### `threads`
- **Purpose**: Number of CPU threads to use
- **Default**: -1 (automatic)
- **Range**: -1, 1-64
- **Recommendations**:
  - **-1**: Auto-detect CPU cores
  - **4-8**: Typical for modern CPUs
  - **16+**: High-performance workstations
- **Impact**:
  - More threads = faster CPU inference
  - Too many threads can cause contention
  - -1 lets system optimize automatically
- **Use case**: Override auto-detection if needed

#### `gpu_layers`
- **Purpose**: Number of model layers to offload to GPU
- **Default**: -1 (all layers)
- **Range**: -1, 0-100
- **Recommendations**:
  - **-1**: Offload all layers to GPU (best performance)
  - **35-50**: Partial offloading for limited VRAM
  - **0**: CPU-only (no GPU)
- **Impact**:
  - GPU offloading dramatically improves speed
  - Requires sufficient GPU VRAM
  - Partial offloading balances speed and memory
- **Use case**: Adjust based on available GPU memory

### API Endpoints

#### GET /api/config

Retrieve current llama-server configuration.

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

Update llama-server configuration.

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
- **Output**: Terminal
- **Format**: Colorized text
- **Log Levels**: All levels
- **Use Case**: Development and production monitoring

#### 2. File Transport
- **File**: `logs/application-YYYY-MM-DD.log`
- **Format**: JSON
- **Log Levels**: All levels (debug, info, warn, error)
- **Rotation**: Daily

#### 3. Error File Transport
- **File**: `logs/errors-YYYY-MM-DD.log`
- **Format**: JSON
- **Log Levels**: Error and warning only
- **Rotation**: Daily

#### 4. WebSocket Transport
- **Delivery**: Real-time via Socket.IO
- **Format**: JSON objects
- **Log Levels**: User-configurable
- **Batches**: Messages batched for efficiency

### Logger Configuration API

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

### Log Retention

- **Automatic Daily Rotation**: New log file created each day at midnight
- **Configurable Retention**: Default 30 days retention
- **Automatic Cleanup**: Old log files automatically deleted
- **Separate Error Logs**: Error logs kept separately for easier access

### Log File Locations

```
logs/
├── application-YYYY-MM-DD.log  # All logs
└── errors-YYYY-MM-DD.log        # Error and warning logs only
```

---

## Environment Variables

### Optional Configuration via `.env.local`

Create `.env.local` in project root for development:

```env
# Application
NODE_ENV=development
PORT=3000
WEBSOCKET_PATH=/llamaproxws

# Performance
METRICS_INTERVAL=10000
MODELS_INTERVAL=30000
LOGS_INTERVAL=15000

# Logging
LOG_LEVEL=debug
LOG_COLORS=true
LOG_VERBOSE=true
```

Create `.env.production` for production:

```env
# Application
NODE_ENV=production
PORT=3000
WEBSOCKET_PATH=/llamaproxws

# Performance (optimized for production)
METRICS_INTERVAL=15000
MODELS_INTERVAL=60000
LOGS_INTERVAL=30000

# Logging
LOG_LEVEL=info
LOG_COLORS=false
LOG_VERBOSE=false
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

### Environment Variable Descriptions

#### NODE_ENV
- **Purpose**: Set application mode
- **Values**: `development`, `production`
- **Impact**:
  - Development: Detailed logging, source maps, hot reload
  - Production: Optimized performance, minimal logging

#### PORT
- **Purpose**: Server listening port
- **Default**: 3000
- **Range**: 1024-65535 (well-known ports require root)
- **Use case**: Change port if default is in use

#### WEBSOCKET_PATH
- **Purpose**: WebSocket endpoint path
- **Default**: `/llamaproxws`
- **Use case**: Customize WebSocket path for reverse proxy configurations

#### METRICS_INTERVAL
- **Purpose**: How often metrics are updated (ms)
- **Default**: 10000ms (10 seconds)
- **Development**: 5000-10000ms
- **Production**: 10000-30000ms
- **Use case**: Balance real-time updates vs server load

#### MODELS_INTERVAL
- **Purpose**: How often model status is refreshed (ms)
- **Default**: 30000ms (30 seconds)
- **Development**: 10000-30000ms
- **Production**: 30000-60000ms
- **Use case**: Adjust based on frequency of model changes

#### LOGS_INTERVAL
- **Purpose**: How often logs are streamed to UI (ms)
- **Default**: 15000ms (15 seconds)
- **Development**: 5000-15000ms
- **Production**: 15000-30000ms
- **Use case**: Balance real-time visibility vs performance

#### LOG_LEVEL
- **Purpose**: Minimum log level to capture
- **Default**: "info"
- **Values**: `debug`, `info`, `warn`, `error`
- **Development**: "debug" - Detailed logging
- **Production**: "info" or "warn" - Reduced noise

---

## Database Configuration

### Database File: `./data/llama-dashboard.db`

The database uses normalized schema v2.0 with specialized tables.

### Key Tables

| Table | Purpose | Fields | Relationships |
|--------|-----------|---------|---------------|
| `models` | Core model data | 26 fields | Primary table |
| `model_sampling_config` | Sampling parameters | 36 fields | 1-to-1 with models |
| `model_memory_config` | Memory settings | 8 fields | 1-to-1 with models |
| `model_gpu_config` | GPU configuration | 10 fields | 1-to-1 with models |
| `model_advanced_config` | Advanced options | 22 fields | 1-to-1 with models |
| `model_lora_config` | LoRA adapters | 21 fields | 1-to-1 with models |
| `model_multimodal_config` | Multimodal settings | 7 fields | 1-to-1 with models |
| `model_server_config` | Global server defaults | 38 fields | Independent |
| `metrics_history` | Last 10 minutes of metrics | 13 fields | Auto-cleanup |
| `metadata` | Dashboard global state | 3 fields | Independent |

### Database Features

- **Cascade Delete**: Deleting a model removes all related configs automatically
- **Independent Server Config**: Global settings persist regardless of models
- **Auto Cleanup**: Metrics older than 10 minutes removed automatically
- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Indexes**: Optimized lookups on model name, status, type

### Database Management Commands

```bash
# Export database backup
pnpm db:export

# Import database backup
pnpm db:import

# Optimize database (vacuum)
pnpm db:vacuum

# Reset database (delete all models)
pnpm db:reset
```

---

## Performance Tuning

### Context Size Tuning

| Use Case | Recommended ctx_size | Memory Impact |
|----------|---------------------|---------------|
| Simple Q&A | 2048-4096 | Low |
| Short conversations | 4096-8192 | Medium |
| Long conversations | 8192-16384 | High |
| Document analysis | 16384-32768 | Very High |

### GPU Layer Tuning

| GPU VRAM | Recommended gpu_layers | Performance |
|----------|----------------------|-------------|
| 4 GB | 20-30 layers | Moderate |
| 8 GB | 35-45 layers | Good |
| 12 GB | 50-60 layers | Very Good |
| 16 GB+ | -1 (all layers) | Excellent |

### Batch Size Tuning

| Use Case | Recommended batch_size | Speed vs Quality |
|----------|----------------------|-----------------|
| Fast inference | 512 | Fastest, lower quality |
| Balanced | 256-512 | Good balance |
| Quality focus | 128-256 | Slower, better quality |

### Thread Tuning

| CPU Cores | Recommended threads |
|-----------|-------------------|
| 4 cores | 4 or -1 |
| 8 cores | 6-8 or -1 |
| 16+ cores | 12-16 or -1 |

---

## Security Configuration

### Current State

**Note**: Current implementation does not include authentication or encryption features. Security configurations are for future implementation.

### Recommended Security Practices

1. **Run on Trusted Networks**: Only expose on private networks
2. **Use Reverse Proxy**: Add nginx/caddy as front-end proxy with TLS
3. **Firewall Rules**: Restrict access to specific IPs
4. **Regular Updates**: Keep dependencies updated
5. **Monitor Logs**: Regularly review access logs

### Future Security Features (Planned)

- JWT-based authentication
- API rate limiting
- HTTPS/TLS support
- IP whitelist/blacklist
- Audit logging

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

# Backup database
pnpm db:export
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

**Configuration Guide - Next.js Llama Async Proxy**
**Version 0.2.0 - December 30, 2025**
