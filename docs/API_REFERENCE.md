# API Reference - Next.js Llama Async Proxy

Complete API documentation for the Next.js Llama Async Proxy, including REST endpoints, WebSocket events, and TypeScript type definitions.

## Base URL

```
http://localhost:3000/api
```

All API endpoints are prefixed with `/api`. The default port is 3000 but can be configured via `PORT` environment variable.

## Authentication

**Current State**: No authentication required (development mode)
**Future State**: JWT-based authentication planned for production

## TypeScript Types

### Configuration Types

```typescript
/**
 * Llama Server Configuration
 * Stored in llama-server-config.json
 */
export interface LlamaServerConfig {
  /** Llama server host address (default: "localhost") */
  host: string;

  /** Llama server port (default: 8134) */
  port: number;

  /** Directory containing GGUF model files */
  basePath: string;

  /** Full path to llama-server binary */
  serverPath: string;

  /** Context window size (default: 8192) */
  ctx_size: number;

  /** Processing batch size (default: 512) */
  batch_size: number;

  /** Number of CPU threads (-1 for auto) */
  threads: number;

  /** GPU layers to offload (-1 for all) */
  gpu_layers: number;
}
```

### API Response Types

```typescript
/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Success status */
  success: boolean;

  /** Response data */
  data?: T;

  /** Error information */
  error?: ApiError;

  /** Response timestamp */
  timestamp: string;
}

/**
 * API Error Information
 */
export interface ApiError {
  /** Error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Additional error details */
  details?: string;
}
```

### Model Types

```typescript
/**
 * Model Information
 */
export interface Model {
  /** Model identifier */
  id: string;

  /** Model name */
  name: string;

  /** Model description */
  description?: string;

  /** Current status */
  status: 'running' | 'loading' | 'stopped' | 'error' | 'discovered';

  /** Model version */
  version?: string;

  /** File path */
  path: string;

  /** File size in bytes */
  size: number;

  /** Model architecture family */
  family: string;

  /** Context window size */
  contextSize?: number;

  /** Time when model was loaded */
  loadedAt?: string;

  /** Time when model was last used */
  lastUsed?: string;

  /** Memory usage when loaded (MB) */
  memoryUsage?: number;

  /** Model format (GGUF, BIN) */
  format?: string;

  /** Quantization level */
  quantization?: string;
}

/**
 * Model List Response
 */
export interface ModelsResponse {
  /** Number of models */
  count: number;

  /** Array of models */
  models: Model[];
}
```

### Health and Monitoring Types

```typescript
/**
 * System Metrics
 */
export interface SystemMetrics {
  /** Timestamp */
  timestamp: string;

  /** CPU metrics */
  cpu: CpuMetrics;

  /** Memory metrics */
  memory: MemoryMetrics;

  /** Disk metrics */
  disk: DiskMetrics;

  /** GPU metrics (if available) */
  gpu?: GpuMetrics[];

  /** Model metrics */
  models: ModelMetrics;

  /** Request metrics */
  requests: RequestMetrics;

  /** Server uptime in seconds */
  uptime: number;
}

/**
 * CPU Metrics
 */
export interface CpuMetrics {
  /** Current usage percentage */
  usage: number;

  /** Number of CPU cores */
  cores: number;

  /** Load average [1min, 5min, 15min] */
  loadAverage: [number, number, number];
}

/**
 * Memory Metrics
 */
export interface MemoryMetrics {
  /** Used memory (MB) */
  used: number;

  /** Total memory (MB) */
  total: number;

  /** Free memory (MB) */
  free: number;

  /** Usage percentage */
  usagePercent: number;
}

/**
 * Disk Metrics
 */
export interface DiskMetrics {
  /** Used disk (bytes) */
  used: number;

  /** Total disk (bytes) */
  total: number;

  /** Free disk (bytes) */
  free: number;

  /** Usage percentage */
  usagePercent: number;
}

/**
 * GPU Metrics
 */
export interface GpuMetrics {
  /** GPU ID */
  id: number;

  /** GPU name */
  name: string;

  /** GPU memory */
  memory: GpuMemory;

  /** Utilization percentage */
  utilization: number;

  /** Temperature in Celsius */
  temperature?: number;
}

/**
 * GPU Memory
 */
export interface GpuMemory {
  /** Used memory (MB) */
  used: number;

  /** Total memory (MB) */
  total: number;

  /** Free memory (MB) */
  free: number;

  /** Usage percentage */
  usagePercent: number;
}

/**
 * Model Metrics
 */
export interface ModelMetrics {
  /** Number of active models */
  active: number;

  /** Total number of models */
  total: number;

  /** Memory usage (MB) */
  memoryUsage: number;
}

/**
 * Request Metrics
 */
export interface RequestMetrics {
  /** Total requests */
  total: number;

  /** Active requests */
  active: number;

  /** Average response time (ms) */
  averageResponseTime: number;

  /** Error rate */
  errorRate: number;
}
```

### Log Types

```typescript
/**
 * Log Entry
 */
export interface LogEntry {
  /** Log ID */
  id: string;

  /** Timestamp */
  timestamp: string;

  /** Log level */
  level: 'error' | 'warn' | 'info' | 'debug';

  /** Log source */
  source: string;

  /** Log message */
  message: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Log Update Response
 */
export interface LogUpdateResponse {
  /** Array of log entries */
  logs: LogEntry[];

  /** Timestamp */
  timestamp: string;
}
```

### WebSocket Types

```typescript
/**
 * WebSocket Message
 */
export interface WebSocketMessage {
  /** Message type */
  type: string;

  /** Message data */
  data: unknown;

  /** Timestamp */
  timestamp: number;

  /** Optional request ID */
  requestId?: string;
}

/**
 * Metrics Update Message
 */
export interface MetricsUpdateMessage extends WebSocketMessage {
  type: 'metrics_update';

  data: SystemMetrics;
}

/**
 * Models Update Message
 */
export interface ModelsUpdateMessage extends WebSocketMessage {
  type: 'models_update';

  data: {
    /** Array of models */
    models: Model[];

    /** Timestamp */
    timestamp: string;
  };
}

/**
 * Logs Update Message
 */
export interface LogsUpdateMessage extends WebSocketMessage {
  type: 'logs_update';

  data: LogUpdateResponse;
}

/**
 * Subscribe Message
 */
export interface SubscribeMessage extends WebSocketMessage {
  type: 'subscribe';

  data: {
    /** Subscription type */
    type: 'metrics' | 'models' | 'logs';
  };
}

/**
 * Error Message
 */
export interface ErrorMessage extends WebSocketMessage {
  type: 'error';

  data: {
    /** Error code */
    code: string;

    /** Error message */
    message: string;

    /** Reconnection info */
    reconnect?: boolean;

    /** Retry delay (ms) */
    retryIn?: number;
  };
}
```

## REST API Endpoints

### Configuration Endpoints

#### GET `/api/config`

Retrieves the current llama-server configuration from `llama-server-config.json`.

**Response:**
```json
{
  "success": true,
  "data": {
    "host": "localhost",
    "port": 8134,
    "basePath": "/path/to/models",
    "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
    "ctx_size": 8192,
    "batch_size": 512,
    "threads": -1,
    "gpu_layers": -1
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Type:**
```typescript
ApiResponse<LlamaServerConfig>
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
  "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

**Type:**
```typescript
LlamaServerConfig
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
    "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
    "ctx_size": 8192,
    "batch_size": 512,
    "threads": -1,
    "gpu_layers": -1
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Type:**
```typescript
ApiResponse<LlamaServerConfig>
```

**Status Codes:**
- `200` - Configuration updated successfully
- `400` - Invalid configuration data
- `500` - Configuration save failed

### Model Endpoints

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
        "format": "gguf",
        "quantization": "Q4_K_M",
        "loadedAt": "2024-12-27T10:00:00Z",
        "lastUsed": "2024-12-27T10:30:00Z"
      }
    ]
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

**Type:**
```typescript
ApiResponse<ModelsResponse>
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

**Type:**
```typescript
ApiResponse<{ registered: number; models: Model[] }>
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

**Type:**
```typescript
ApiResponse<{
  discovered: Model[];
  scannedPaths: string[];
  totalFound: number;
}>
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

**Type:**
```typescript
ApiResponse<{ modelId: string }>
```

**Status Codes:**
- `200` - Success
- `404` - Model not found
- `409` - Model is currently in use

### Health Endpoints

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

**Type:**
```typescript
ApiResponse<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    proxy: { status: string; uptime: number; version: string };
    llama_server: { status: string; host: string; port: number; models_loaded: number; last_health_check: string };
  };
  system: { cpu_usage: number; memory_usage: number; disk_usage: number };
}>
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

**Type:**
```typescript
ApiResponse<{
  application: { name: string; version: string; environment: string; uptime: number; start_time: string };
  server: { port: number; host: string; ssl: boolean; cors_enabled: boolean };
  websocket: { connected_clients: number; active_connections: number; messages_per_second: number };
  models: { registered: number; loaded: number; loading: number; failed: number };
  performance: { requests_total: number; requests_active: number; average_response_time: number; error_rate: number };
}>
```

**Status Codes:**
- `200` - Success

### Monitoring Endpoints

#### GET `/api/monitoring`

Retrieves current system performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-12-27T10:00:00Z",
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

**Type:**
```typescript
ApiResponse<SystemMetrics>
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

**Type:**
```typescript
ApiResponse<{
  period: { start: string; end: string; resolution: string };
  metrics: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    gpu?: number;
    requests: number;
    responseTime: number;
  }>;
  summary: {
    avgCpu: number;
    maxCpu: number;
    avgMemory: number;
    maxMemory: number;
    totalRequests: number;
    avgResponseTime: number;
  };
}>
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

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/llamaproxws'
});
```

### Connection Details
- **Path**: `/llamaproxws`
- **Host**: `localhost:3000` (default, configurable via PORT env var)
- **Transport**: WebSocket with HTTP polling fallback

### Client Events

#### Connection Events

```typescript
// Connected successfully
socket.on('connect', () => {
  console.log('Connected to server');
});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Error
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

#### Subscription

```typescript
// Subscribe to metrics updates
socket.emit('subscribe', { type: 'metrics' });

// Subscribe to model updates
socket.emit('subscribe', { type: 'models' });

// Subscribe to logs
socket.emit('subscribe', { type: 'logs' });
```

### Server Events

#### Metrics Update

```typescript
// Received every 10 seconds
socket.on('metrics_update', (data: SystemMetrics) => {
  console.log('CPU:', data.cpu.usage);
  console.log('Memory:', data.memory.usagePercent);
  console.log('GPU:', data.gpu?.[0]?.utilization);
});
```

**Type:**
```typescript
MetricsUpdateMessage
```

#### Models Update

```typescript
// Received every 30 seconds
socket.on('models_update', (data) => {
  console.log('Active models:', data.models.length);
  data.models.forEach(model => {
    console.log(`Model ${model.name} is ${model.status}`);
  });
});
```

**Type:**
```typescript
ModelsUpdateMessage
```

#### Logs Update

```typescript
// Received every 15 seconds
socket.on('logs_update', (data) => {
  data.logs.forEach(log => {
    console.log(`[${log.level}] ${log.message}`);
  });
});
```

**Type:**
```typescript
LogsUpdateMessage
```

#### Error Message

```typescript
// Received on errors
socket.on('error', (data) => {
  console.error('Error:', data.message);
  console.error('Code:', data.code);
  if (data.reconnect) {
    console.log(`Will retry in ${data.retryIn}ms`);
  }
});
```

**Type:**
```typescript
ErrorMessage
```

## Component Props

### useApi Hook

```typescript
import { useApi } from '@/hooks/use-api';

// Returns
interface UseApiResult {
  config: LlamaServerConfig | null;
  models: Model[] | null;
  metrics: SystemMetrics | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

### useWebSocket Hook

```typescript
import { useWebSocket } from '@/hooks/use-websocket';

// Returns
interface UseWebSocketResult {
  connected: boolean;
  metrics: SystemMetrics | null;
  models: Model[] | null;
  logs: LogEntry[] | null;
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (type: string) => void;
}
```

## Service Methods

### ApiService

```typescript
class ApiService {
  // Configuration
  async getConfig(): Promise<LlamaServerConfig>;
  async updateConfig(config: LlamaServerConfig): Promise<LlamaServerConfig>;

  // Models
  async getModels(): Promise<ModelsResponse>;
  async registerModels(models: Partial<Model>[]): Promise<{ registered: number; models: Model[] }>;
  async discoverModels(paths: string[], options?: DiscoverOptions): Promise<{ discovered: Model[]; totalFound: number }>;
  async removeModel(id: string): Promise<{ modelId: string }>;

  // Health
  async getHealth(): Promise<HealthResponse>;
  async getStatus(): Promise<StatusResponse>;

  // Monitoring
  async getMetrics(): Promise<SystemMetrics>;
  async getMetricsHistory(hours?: number, resolution?: string): Promise<MetricsHistoryResponse>;
}
```

## Configuration Service

### server-config.ts

```typescript
// Load configuration from llama-server-config.json
export async function loadConfig(): Promise<LlamaServerConfig>;

// Save configuration to llama-server-config.json
export async function saveConfig(config: LlamaServerConfig): Promise<void>;

// Get default configuration
export function getDefaultConfig(): LlamaServerConfig;

// Validate configuration
export function validateConfig(config: Partial<LlamaServerConfig>): { valid: boolean; errors: string[] };
```

## Error Handling

### Error Codes

- `VALIDATION_ERROR` (400) - Invalid request data
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable

### Error Response Format

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

## Usage Examples

### JavaScript/TypeScript Client

```typescript
import { ApiService } from '@/services/api-service';

const apiService = new ApiService();

// Get configuration
const config = await apiService.getConfig();
console.log('Llama server port:', config.port);

// Update configuration
await apiService.updateConfig({
  host: 'localhost',
  port: 8134,
  basePath: '/models',
  serverPath: '/usr/local/bin/llama-server',
  ctx_size: 8192,
  batch_size: 512,
  threads: -1,
  gpu_layers: -1
});

// List models
const models = await apiService.getModels();
console.log('Available models:', models.models);

// Get metrics
const metrics = await apiService.getMetrics();
console.log('CPU usage:', metrics.cpu.usage);
console.log('Memory usage:', metrics.memory.usagePercent);
```

### React Component Example

```typescript
import { useApi } from '@/hooks/use-api';
import { useWebSocket } from '@/hooks/use-websocket';

function Dashboard() {
  const { config, models, metrics, loading } = useApi();
  const { connected, logs } = useWebSocket();

  return (
    <div>
      <h1>Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>WebSocket: {connected ? 'Connected' : 'Disconnected'}</p>
          <p>Models: {models?.count || 0}</p>
          <p>CPU: {metrics?.cpu.usage || 0}%</p>
          <p>Memory: {metrics?.memory.usagePercent || 0}%</p>
        </>
      )}
    </div>
  );
}
```

### WebSocket Client Example

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/llamaproxws',
  transports: ['websocket', 'polling']
});

// Subscribe to metrics
socket.on('connect', () => {
  socket.emit('subscribe', { type: 'metrics' });
});

// Listen for metrics updates
socket.on('metrics_update', (data) => {
  console.log('Metrics update:', data);
  // Update UI with new metrics
});

// Handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Disconnect
socket.disconnect();
```

---

**API Reference - Next.js Llama Async Proxy**
**Version 1.0.0 - December 27, 2025**
