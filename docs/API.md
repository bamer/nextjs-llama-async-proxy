# API Documentation - Next.js Llama Async Proxy

Complete API documentation for the Next.js Llama Async Proxy, including REST endpoints, WebSocket events, and configuration options.

## Base URL

```
http://localhost:3000/api
```

All API endpoints are prefixed with `/api`. The default port is 3000 but can be configured via `PORT` environment variable.

## Authentication

**Current State**: No authentication required (development mode)
**Future State**: JWT-based authentication planned for production

## Configuration API

### Configuration Management

Configuration is stored in `llama-server-config.json` and managed via API endpoints.

#### GET `/api/config`

Retrieves the current llama-server configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "host": "localhost",
    "port": 8134,
    "basePath": "/media/bamer/crucial MX300/llm/llama/models",
    "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
    "ctx_size": 8192,
    "batch_size": 512,
    "threads": -1,
    "gpu_layers": -1
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `500` - Internal server error

#### POST `/api/config`

Updates and saves the llama-server configuration to `llama-server-config.json`.

**Request Body:**
```json
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/path/to/models",
  "serverPath": "/path/to/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully",
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
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Configuration Fields:**
- `host` (string): Llama server host address (default: "localhost")
- `port` (number): Llama server port (default: 8134)
- `basePath` (string): Directory containing GGUF model files
- `serverPath` (string): Full path to llama-server binary
- `ctx_size` (number): Context window size (default: 8192)
- `batch_size` (number): Processing batch size (default: 512)
- `threads` (number): Number of CPU threads (-1 for auto)
- `gpu_layers` (number): GPU layers to offload (-1 for all)

**Status Codes:**
- `200` - Configuration updated successfully
- `400` - Invalid configuration data
- `500` - Configuration save failed

**Note**: This endpoint updates the JSON file directly and does NOT restart the server. Server restart required for changes to take effect.

## Models Management

#### GET `/api/models`

Retrieves the list of registered models and their current status.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 3,
    "models": [
      {
        "id": "llama-2-7b-chat",
        "name": "llama-2-7b-chat",
        "description": "Chat model for Llama 2",
        "status": "running",
        "version": "2.0",
        "path": "/path/to/model.gguf",
        "size": 3758096384,
        "family": "llama",
        "contextSize": 4096,
        "loadedAt": "2024-12-27T10:00:00Z",
        "lastUsed": "2024-12-27T10:30:00Z"
      }
    ]
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `500` - Internal server error

#### POST `/api/models`

Registers new models for management.

**Request Body:**
```json
{
  "models": [
    {
      "name": "mistral-7b",
      "description": "Mistral model",
      "path": "/path/to/model.gguf",
      "family": "mistral",
      "version": "1.0"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Models registered successfully",
  "data": {
    "registered": 1,
    "models": [
      {
        "id": "mistral-7b",
        "name": "mistral-7b",
        "status": "registered"
      }
    ]
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request data
- `409` - Model already exists

#### POST `/api/models/discover`

Automatically discovers models from configured directories.

**Request Body:**
```json
{
  "paths": ["/path/to/models", "/another/path"],
  "recursive": true,
  "includePatterns": ["*.gguf", "*.bin"],
  "excludePatterns": ["*.tmp", "*.bak"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "discovered": [
      {
        "name": "llama-3-8b-instruct",
        "description": "Llama 3 Base model",
        "version": "3.0",
        "path": "/path/to/models/llama-3-8b-instruct.gguf",
        "family": "llama",
        "size": 8540000000,
        "format": "gguf",
        "quantization": "Q4_K_M",
        "contextSize": 8192
      }
    ],
    "scannedPaths": ["/path/to/models", "/another/path"],
    "totalFound": 1
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid paths
- `500` - File system error

#### DELETE `/api/models/:id`

Removes a model from the registry.

**Path Parameters:**
- `id` (string) - Model identifier

**Response:**
```json
{
  "success": true,
  "message": "Model removed successfully",
  "data": {
    "modelId": "llama-2-7b-chat"
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `404` - Model not found
- `409` - Model is currently in use

## Health and Status

### Health Checks

#### GET `/api/health`

Retrieves the health status of the proxy and connected services.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-12-27T10:00:00Z",
    "services": {
      "proxy": {
        "status": "healthy",
        "uptime": 3600,
        "version": "0.1.0"
      },
      "llama_server": {
        "status": "healthy",
        "host": "localhost",
        "port": 8134,
        "models_loaded": 1,
        "last_health_check": "2024-12-27T09:59:45Z"
      }
    },
    "system": {
      "cpu_usage": 45.2,
      "memory_usage": 67.8,
      "disk_usage": 46.9
    }
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - All services healthy
- `503` - One or more services unhealthy

#### GET `/api/status`

Retrieves detailed system and application status.

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "name": "Next.js Llama Async Proxy",
      "version": "0.1.0",
      "environment": "development",
      "uptime": 3600,
      "start_time": "2024-12-27T09:00:00Z"
    },
    "server": {
      "port": 3000,
      "host": "0.0.0.0",
      "ssl": false,
      "cors_enabled": true
    },
    "websocket": {
      "connected_clients": 3,
      "active_connections": 2,
      "messages_per_second": 15.2
    },
    "models": {
      "registered": 5,
      "loaded": 1,
      "loading": 0,
      "failed": 0
    },
    "performance": {
      "requests_total": 1234,
      "requests_active": 2,
      "average_response_time": 245,
      "error_rate": 0.01
    }
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success

## Monitoring and Metrics

### Performance Metrics

#### GET `/api/monitoring`

Retrieves current system performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-12-27T10:00:00Z",
    "system": {
      "cpu": {
        "usage": 45.2,
        "cores": 8,
        "loadAverage": [1.2, 1.1, 1.0]
      },
      "memory": {
        "used": 67.8,
        "total": 16384,
        "free": 5432,
        "usagePercent": 67.8
      },
      "disk": {
        "used": 234567890,
        "total": 500000000,
        "free": 265432110,
        "usagePercent": 46.9
      }
    },
    "gpu": [
      {
        "id": 0,
        "name": "NVIDIA GeForce RTX 3080",
        "memory": {
          "used": 4096,
          "total": 10240,
          "free": 6144,
          "usagePercent": 40.0
        },
        "utilization": 85.5,
        "temperature": 72
      }
    ],
    "models": {
      "active": 1,
      "total": 3,
      "memoryUsage": 4096
    },
    "requests": {
      "total": 1234,
      "active": 2,
      "averageResponseTime": 245
    },
    "uptime": 3600
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `503` - Monitoring service unavailable

#### GET `/api/monitoring/history`

Retrieves historical performance metrics.

**Query Parameters:**
- `hours` (number, optional) - Hours of history to retrieve (default: 24, max: 168)
- `resolution` (string, optional) - Data resolution: "1m", "5m", "15m", "1h" (default: "5m")

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-12-26T10:00:00Z",
      "end": "2024-12-27T10:00:00Z",
      "resolution": "5m"
    },
    "metrics": [
      {
        "timestamp": "2024-12-27T09:55:00Z",
        "cpu": 42.3,
        "memory": 65.1,
        "gpu": 78.4,
        "requests": 12,
        "responseTime": 234
      },
      {
        "timestamp": "2024-12-27T10:00:00Z",
        "cpu": 45.2,
        "memory": 67.8,
        "gpu": 85.5,
        "requests": 15,
        "responseTime": 245
      }
    ],
    "summary": {
      "avgCpu": 43.75,
      "maxCpu": 45.2,
      "avgMemory": 66.45,
      "maxMemory": 67.8,
      "totalRequests": 27,
      "avgResponseTime": 239.5
    }
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid parameters
- `503` - Monitoring service unavailable

## WebSocket API

### Connection

```
ws://localhost:3000/llamaproxws
```

Or using Socket.IO client:

```javascript
const io = require("socket.io-client");
const socket = io("http://localhost:3000", {
  path: "/llamaproxws"
});
```

### Connection Details
- **Path**: `/llamaproxws`
- **Host**: `localhost:3000` (default, configurable via PORT env var)
- **Transport**: WebSocket with HTTP polling fallback

### Message Format

All WebSocket messages follow this structure:

```typescript
interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
  requestId?: string;
}
```

### Events

#### Client → Server Events

```javascript
// Subscribe to metrics updates
socket.emit('subscribe', { type: 'metrics' });

// Subscribe to model updates
socket.emit('subscribe', { type: 'models' });

// Subscribe to logs
socket.emit('subscribe', { type: 'logs' });

// Send command
socket.emit('command', {
  type: 'load_model',
  data: { modelId: 'llama-2-7b' }
});
```

#### Server → Client Events

```javascript
// Metrics update (every 10 seconds)
socket.on('metrics_update', (data) => {
  console.log('Metrics:', data);
  // { cpu: 45.2, memory: 67.8, gpu: 85.5, timestamp: ... }
});

// Model status update (every 30 seconds)
socket.on('models_update', (data) => {
  console.log('Models:', data);
  // { models: [{ id: '...', status: 'running', ... }], timestamp: ... }
});

// Log entries (every 15 seconds)
socket.on('logs_update', (data) => {
  console.log('Logs:', data);
  // { logs: [{ level: 'info', message: '...', timestamp: ... }], timestamp: ... }
});

// Error events
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Connection status
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
```

## Error Responses

### Error Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error information"
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid request data
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid configuration data",
    "details": "Port must be between 1 and 65535"
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

## Rate Limiting

- **REST API**: 100 requests per minute per IP address
- **WebSocket**: Unlimited connections, 1000 messages per minute per client
- **File Uploads**: 10 MB per request, 50 MB per hour per IP

Rate limit headers are included in HTTP responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Versioning

The API follows semantic versioning:
- **Major version** (v1, v2) - Breaking changes
- **Minor version** (v1.1, v1.2) - New features, backward compatible
- **Patch version** (v1.1.1, v1.1.2) - Bug fixes

Current version: **v1.0.0**

Version is included in response headers:
```
X-API-Version: v1.0.0
```

## API Usage Examples

### Using cURL

```bash
# Get configuration
curl http://localhost:3000/api/config

# Update configuration
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"host":"localhost","port":8134,"basePath":"/models"}'

# List models
curl http://localhost:3000/api/models

# Health check
curl http://localhost:3000/api/health

# Get metrics
curl http://localhost:3000/api/monitoring
```

### Using JavaScript/TypeScript

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Get configuration
const config = await apiClient.get('/config');
console.log(config.data);

// Update configuration
await apiClient.post('/config', {
  host: 'localhost',
  port: 8134,
  basePath: '/models'
});

// List models
const models = await apiClient.get('/models');
console.log(models.data);

// Health check
const health = await apiClient.get('/health');
console.log(health.data);
```

### Using Socket.IO Client

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/llamaproxws'
});

// Subscribe to metrics
socket.on('connect', () => {
  socket.emit('subscribe', { type: 'metrics' });
});

// Listen for metrics updates
socket.on('metrics_update', (data) => {
  console.log('CPU:', data.cpu);
  console.log('Memory:', data.memory);
  console.log('GPU:', data.gpu);
});

// Handle errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Disconnect
socket.disconnect();
```

## Testing

### Using Jest

Test API endpoints with Jest and supertest:

```typescript
import request from 'supertest';
import app from '../server';

describe('API Tests', () => {
  test('GET /api/health', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('GET /api/config', async () => {
    const response = await request(app)
      .get('/api/config')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

See `__tests__/app/api/config/route.test.ts` for complete API test examples.

## Monitoring and Logging

All API requests are logged with:
- Timestamp
- Request method and path
- Response status code
- Request duration
- Client IP address

Logs are written to Winston logger with daily rotation:
- `logs/application-YYYY-MM-DD.log`
- `logs/errors-YYYY-MM-DD.log`

---

**API Documentation - Next.js Llama Async Proxy**
**Version 1.0.0 - December 27, 2025**
