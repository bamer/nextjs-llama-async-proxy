# API Reference - Next.js Llama Async Proxy

Complete API documentation for the Next.js Llama Async Proxy, including REST endpoints, WebSocket events, and configuration options.

## Base URL

```
http://localhost:3000/api
```

All API endpoints are prefixed with `/api`. The default port is 3000 but can be configured via environment variables.

## Authentication

**Current State**: No authentication required (development mode)
**Future State**: JWT-based authentication planned for production

## REST API Endpoints

### Models Management

#### GET `/api/models`
Retrieves the list of registered models and their current status.

**Response:**
```json
{
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
      "loadedAt": "2024-01-15T10:00:00Z",
      "lastUsed": "2024-01-15T10:30:00Z"
    }
  ]
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
  "message": "Models registered successfully",
  "registered": 1,
  "models": [
    {
      "id": "mistral-7b",
      "name": "mistral-7b",
      "status": "registered"
    }
  ]
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
  "totalFound": 1,
  "errors": []
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
  "message": "Model removed successfully",
  "modelId": "llama-2-7b-chat"
}
```

**Status Codes:**
- `200` - Success
- `404` - Model not found
- `409` - Model is currently in use

#### POST `/api/models/:id/load`
Loads a model into memory.

**Path Parameters:**
- `id` (string) - Model identifier

**Request Body:**
```json
{
  "config": {
    "n_ctx": 4096,
    "n_gpu_layers": 35,
    "temperature": 0.7
  }
}
```

**Response:**
```json
{
  "message": "Model loading initiated",
  "modelId": "llama-2-7b-chat",
  "status": "loading",
  "estimatedTime": 30
}
```

**Status Codes:**
- `202` - Loading initiated
- `404` - Model not found
- `409` - Another model is loading

#### POST `/api/models/:id/unload`
Unloads a model from memory.

**Path Parameters:**
- `id` (string) - Model identifier

**Response:**
```json
{
  "message": "Model unloading initiated",
  "modelId": "llama-2-7b-chat",
  "status": "unloading"
}
```

**Status Codes:**
- `202` - Unloading initiated
- `404` - Model not found
- `409` - Model is in use

### Configuration Management

#### GET `/api/config`
Retrieves the current application configuration.

**Response:**
```json
{
  "app": {
    "name": "Next.js Llama Async Proxy",
    "version": "0.1.0",
    "port": 3000,
    "environment": "development"
  },
  "llama_server": {
    "host": "localhost",
    "port": 8080,
    "timeout": 30000,
    "path": "/usr/local/bin/llama-server"
  },
  "llama_config": {
    "n_ctx": 4096,
    "n_gpu_layers": 35,
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 512
  },
  "model_paths": {
    "modelsDir": "./models",
    "defaultModel": null
  },
  "update_intervals": {
    "metrics": 10000,
    "models": 30000,
    "logs": 15000
  }
}
```

**Status Codes:**
- `200` - Success

#### POST `/api/config`
Updates the application configuration.

**Request Body:**
```json
{
  "llama_config": {
    "temperature": 0.8,
    "max_tokens": 1024
  },
  "model_paths": {
    "modelsDir": "/new/models/path"
  },
  "reset": false
}
```

**Response:**
```json
{
  "message": "Configuration updated successfully",
  "changes": {
    "llama_config.temperature": 0.8,
    "llama_config.max_tokens": 1024,
    "model_paths.modelsDir": "/new/models/path"
  },
  "requiresRestart": false
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid configuration
- `500` - Configuration save failed

### Monitoring and Metrics

#### GET `/api/monitoring`
Retrieves current system performance metrics.

**Response:**
```json
{
  "timestamp": "2024-01-15T10:00:00Z",
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
  "period": {
    "start": "2024-01-14T10:00:00Z",
    "end": "2024-01-15T10:00:00Z",
    "resolution": "5m"
  },
  "metrics": [
    {
      "timestamp": "2024-01-15T09:55:00Z",
      "cpu": 42.3,
      "memory": 65.1,
      "gpu": 78.4,
      "requests": 12,
      "responseTime": 234
    },
    {
      "timestamp": "2024-01-15T10:00:00Z",
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
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid parameters
- `503` - Monitoring service unavailable

### Parameters Management

#### GET `/api/parameters`
Lists available parameter categories.

**Response:**
```json
{
  "categories": [
    {
      "id": "model",
      "name": "Model Parameters",
      "description": "Parameters affecting model behavior",
      "count": 15
    },
    {
      "id": "system",
      "name": "System Parameters",
      "description": "System-level configuration",
      "count": 8
    },
    {
      "id": "performance",
      "name": "Performance Parameters",
      "description": "Performance and optimization settings",
      "count": 12
    }
  ]
}
```

**Status Codes:**
- `200` - Success

#### GET `/api/parameters/:category`
Retrieves parameters for a specific category.

**Path Parameters:**
- `category` (string) - Parameter category (model, system, performance)

**Response:**
```json
{
  "category": "model",
  "name": "Model Parameters",
  "parameters": {
    "temperature": {
      "value": 0.7,
      "default": 0.7,
      "min": 0.0,
      "max": 2.0,
      "type": "number",
      "step": 0.1,
      "description": "Controls randomness in generation. Higher values make output more random.",
      "group": "sampling"
    },
    "max_tokens": {
      "value": 512,
      "default": 100,
      "min": 1,
      "max": 4096,
      "type": "integer",
      "description": "Maximum number of tokens to generate.",
      "group": "generation"
    },
    "top_p": {
      "value": 0.9,
      "default": 0.9,
      "min": 0.0,
      "max": 1.0,
      "type": "number",
      "step": 0.01,
      "description": "Top-p sampling parameter.",
      "group": "sampling"
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Category not found

#### GET `/api/parameters/category/:paramName`
Retrieves a specific parameter value.

**Path Parameters:**
- `paramName` (string) - Parameter name

**Response:**
```json
{
  "parameter": "temperature",
  "category": "model",
  "value": 0.7,
  "default": 0.7,
  "metadata": {
    "type": "number",
    "min": 0.0,
    "max": 2.0,
    "description": "Controls randomness in generation"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Parameter not found

#### POST `/api/parameters/:category`
Updates parameters for a specific category.

**Path Parameters:**
- `category` (string) - Parameter category

**Request Body:**
```json
{
  "parameters": {
    "temperature": 0.8,
    "max_tokens": 1024,
    "top_p": 0.95
  }
}
```

**Response:**
```json
{
  "message": "Parameters updated successfully",
  "category": "model",
  "updated": ["temperature", "max_tokens", "top_p"],
  "requiresRestart": false
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid parameter values
- `404` - Category not found

### Health and Status

#### GET `/api/health`
Retrieves the health status of the proxy and connected services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "services": {
    "proxy": {
      "status": "healthy",
      "uptime": 3600,
      "version": "0.1.0"
    },
    "llama_server": {
      "status": "healthy",
      "host": "localhost",
      "port": 8080,
      "models_loaded": 1,
      "last_health_check": "2024-01-15T09:59:45Z"
    },
    "database": {
      "status": "healthy",
      "connections": 5,
      "response_time": 12
    }
  },
  "system": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 46.9
  }
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
  "application": {
    "name": "Next.js Llama Async Proxy",
    "version": "0.1.0",
    "environment": "development",
    "uptime": 3600,
    "start_time": "2024-01-15T09:00:00Z"
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
}
```

**Status Codes:**
- `200` - Success

## WebSocket API

### Connection
```
ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

The application uses Socket.IO for real-time communication with automatic fallback to HTTP polling.

### Namespaces

#### Default Namespace (`/`)
General application events and status updates.

**Events:**
- `connect` - Client connected
- `disconnect` - Client disconnected
- `error` - Connection error

#### Metrics Namespace (`/metrics`)
Real-time performance metrics streaming.

**Server Events:**
```javascript
// CPU, Memory, GPU metrics (every 10 seconds)
socket.emit('metrics:update', {
  timestamp: '2024-01-15T10:00:00Z',
  cpu: 45.2,
  memory: 67.8,
  gpu: 85.5,
  requests: 15
});
```

#### Models Namespace (`/models`)
Model status and lifecycle events.

**Server Events:**
```javascript
// Model status updates (every 30 seconds)
socket.emit('models:update', {
  models: [
    {
      id: 'llama-2-7b-chat',
      status: 'running',
      memoryUsage: 4096,
      lastActivity: '2024-01-15T10:00:00Z'
    }
  ]
});

// Model loading progress
socket.emit('model:loading', {
  modelId: 'llama-2-7b-chat',
  progress: 75,
  stage: 'loading_weights',
  estimatedTimeRemaining: 15
});

// Model loaded successfully
socket.emit('model:loaded', {
  modelId: 'llama-2-7b-chat',
  loadTime: 45,
  memoryUsage: 4096
});
```

#### Logs Namespace (`/logs`)
Real-time log streaming and filtering.

**Server Events:**
```javascript
// Log entries (every 15 seconds batch)
socket.emit('logs:update', {
  logs: [
    {
      id: 'log_12345',
      timestamp: '2024-01-15T10:00:00Z',
      level: 'info',
      source: 'llama-server',
      message: 'Model loaded successfully',
      metadata: {
        model: 'llama-2-7b-chat',
        loadTime: 45
      }
    },
    {
      id: 'log_12346',
      timestamp: '2024-01-15T10:00:01Z',
      level: 'debug',
      source: 'proxy',
      message: 'Health check passed',
      metadata: {
        responseTime: 12,
        statusCode: 200
      }
    }
  ]
});
```

**Client Events:**
```javascript
// Subscribe to specific log levels
socket.emit('logs:filter', {
  levels: ['error', 'warn', 'info'],
  sources: ['llama-server', 'proxy'],
  limit: 100
});

// Clear log filters
socket.emit('logs:clear_filters');
```

### Error Handling

All WebSocket communications include error handling:

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Handle reconnection logic
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Implement exponential backoff
});
```

## Error Responses

### HTTP Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error information",
    "timestamp": "2024-01-15T10:00:00Z",
    "requestId": "req_12345"
  },
  "status": 400
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400) - Invalid request data
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable

### WebSocket Error Events
```javascript
socket.emit('error', {
  code: 'CONNECTION_LOST',
  message: 'Lost connection to server',
  reconnect: true,
  retryIn: 5000
});
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

## SDKs and Libraries

### JavaScript/TypeScript Client
```javascript
import { LlamaProxyClient } from '@llama-proxy/client';

const client = new LlamaProxyClient({
  baseURL: 'http://localhost:3000/api',
  apiKey: 'your-api-key' // Future use
});

// Get models
const models = await client.models.list();

// Load a model
await client.models.load('llama-2-7b-chat', {
  temperature: 0.7,
  maxTokens: 512
});

// Real-time metrics
client.on('metrics', (metrics) => {
  console.log('CPU usage:', metrics.cpu);
});
```

### Python Client
```python
from llama_proxy import LlamaProxyClient

client = LlamaProxyClient(
    base_url="http://localhost:3000/api",
    api_key="your-api-key"  # Future use
)

# Get models
models = client.models.list()

# Load model
client.models.load("llama-2-7b-chat", {
    "temperature": 0.7,
    "max_tokens": 512
})

# Stream metrics
for metrics in client.metrics.stream():
    print(f"CPU: {metrics.cpu}%")
```

## Changelog

### v1.0.0 (Current)
- Initial stable release
- Complete REST API for model management
- Real-time WebSocket streaming
- Comprehensive monitoring endpoints
- Full parameter management system

### Future Versions
- **v1.1.0**: Authentication and authorization
- **v1.2.0**: Batch operations and advanced filtering
- **v2.0.0**: GraphQL API support (breaking change)

---

*API Reference - Next.js Llama Async Proxy v1.0.0*
*Last updated: December 26, 2025*