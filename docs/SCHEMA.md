# Database Schema Documentation

## Llama Async Proxy Dashboard

This document provides comprehensive documentation for the SQLite database schema used in the Llama Async Proxy Dashboard. It covers database structure, table definitions, indexes, repository APIs, and best practices for database operations.

---

## 1. Database Overview

### 1.1 Database Location and Configuration

The Llama Async Proxy Dashboard uses SQLite as its primary database engine, leveraging the `better-sqlite3` driver for synchronous, high-performance database operations. The database file is located at:

```
data/llama-dashboard.db
```

This file is created automatically when the application first starts if it does not already exist. The database stores all persistent application data including model metadata, performance metrics, application logs, server configuration, and general metadata.

### 1.2 Database Driver

The application uses `better-sqlite3` as the SQLite driver, which offers several advantages:

- **Synchronous API**: Unlike async drivers, better-sqlite3 executes queries in the main thread but provides better performance for read-heavy workloads due to reduced overhead
- **Prepared Statements**: All queries use prepared statements for SQL injection protection
- **Transaction Support**: Full transaction support for atomic operations
- **Type Safety**: Better type inference for TypeScript projects

The driver is initialized with the database path and creates all required tables and indexes on first run. The database connection is managed through the `DBBase` class which handles connection lifecycle and provides repository access.

### 1.3 Database File Structure

The database file itself is a single binary file containing all tables, indexes, and data. The internal structure follows SQLite conventions:

| Component | Description |
|-----------|-------------|
| **Page Size** | 4096 bytes (default SQLite configuration) |
| **File Format** | SQLite 3 binary format |
| **Journal Mode** | Default rollback journal for crash recovery |
| **Encoding** | UTF-8 |

The database schema is versioned through migration scripts that add new columns to existing tables without data loss. This approach ensures backward compatibility while allowing schema evolution over time.

### 1.4 Backup Procedures

Regular database backups are essential for data preservation. The application provides the following backup mechanism:

```bash
# Export database backup using the built-in script
pnpm db:export
```

The export script creates a timestamped backup file in a designated backup directory. Alternatively, you can manually backup the database using standard SQLite tools:

```bash
# Create a hot backup
sqlite3 data/llama-dashboard.db ".backup backup/llama-dashboard-$(date +%Y%m%d).db"

# Export as SQL dump
sqlite3 data/llama-dashboard.db ".dump" > backup/llama-dashboard-$(date +%Y%m%d).sql
```

For automated backups, consider scheduling the export command via cron or a task runner:

```bash
# Daily backup at 2 AM
0 2 * * * cd /home/bamer/nextjs-llama-async-proxy && pnpm db:export
```

### 1.5 Migration Strategy

The database uses a column-based migration strategy that adds new columns to existing tables without requiring table recreation. This approach maintains all existing data while extending schema capabilities.

The migration process works as follows:

1. On application startup, `runAllMigrations()` is called
2. Each migration checks if a column already exists using `PRAGMA table_info()`
3. If the column is missing, it is added with `ALTER TABLE ADD COLUMN`
4. Migration status is logged for debugging purposes

Current migrations include:

| Table | Migrations Added |
|-------|-----------------|
| models | embedding_size, block_count, head_count, head_count_kv, ffn_dim, file_type, favorite |
| metrics | gpu_usage, gpu_memory_used, gpu_memory_total, swap_usage |

This migration strategy ensures that upgrading the application never loses existing data, making deployments safer and more predictable.

---

## 2. Database Schema Diagram

### 2.1 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA OVERVIEW                           │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐                    ┌──────────────────┐
  │     models       │                    │     metrics      │
  ├──────────────────┤                    ├──────────────────┤
  │ id (PK)          │                    │ id (PK, AI)      │
  │ name             │                    │ cpu_usage        │
  │ type             │                    │ memory_usage     │
  │ status           │◄───────────────────│ disk_usage       │
  │ parameters (JSON)│   1-to-many        │ active_models    │
  │ model_path       │                    │ uptime           │
  │ file_size        │                    │ gpu_usage        │
  │ ...              │                    │ timestamp (INDEX)│
  │ created_at       │                    └──────────────────┘
  │ updated_at       │                              │
  └──────────────────┘                              │
         │                                          │
         │ (1-to-many with metrics                  │ (time-series)
         │  for monitoring)                         │
         │                                          │
         ▼                                          ▼
  ┌──────────────────┐                    ┌──────────────────┐
  │     logs         │                    │  server_config   │
  ├──────────────────┤                    ├──────────────────┤
  │ id (PK, AI)      │                    │ key (PK)         │
  │ level            │                    │ value            │
  │ message          │                    └──────────────────┘
  │ source           │
  │ timestamp (INDEX)│
  └──────────────────┘
         │
         │ (application logging)
         │
         ▼
  ┌──────────────────┐
  │    metadata      │
  ├──────────────────┤
  │ key (PK)         │
  │ value            │
  │ updated_at       │
  └──────────────────┘
```

### 2.2 Table Relationships

The database uses a star-like pattern where the models table serves as the central entity. The metrics table stores time-series data associated with model activity, while logs provide an audit trail of application events. The server_config and metadata tables serve as key-value stores for application settings and arbitrary data respectively.

| Relationship | Type | Description |
|--------------|------|-------------|
| models -> metrics | One-to-Many | Each model can have multiple metrics entries over time |
| models -> logs | One-to-Many | Each model can generate multiple log entries |
| All tables | Independent | No foreign key constraints; independent operation |

### 2.3 Indexes Overview

Indexes are critical for query performance. The following indexes are automatically created:

| Index Name | Table | Columns | Purpose | Type |
|------------|-------|---------|---------|------|
| idx_models_status | models | status | Filter models by operational status | B-tree |
| idx_models_name | models | name | Search and sort models by name | B-tree |
| idx_models_created | models | created_at DESC | Sort models by creation date | B-tree |
| idx_metrics_timestamp | metrics | timestamp DESC | Time-based metrics queries | B-tree |
| idx_logs_timestamp | logs | timestamp DESC | Recent logs retrieval | B-tree |
| idx_logs_source | logs | source | Filter logs by component | B-tree |
| idx_logs_level | logs | level | Filter logs by severity level | B-tree |
| idx_metadata_key | metadata | key | Fast metadata key lookups | B-tree |

---

## 3. Models Table

### 3.1 Table Definition

```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'llama',
  status TEXT DEFAULT 'idle',
  parameters TEXT DEFAULT '{}',
  model_path TEXT,
  file_size INTEGER,
  params TEXT,
  quantization TEXT,
  ctx_size INTEGER DEFAULT 4096,
  embedding_size INTEGER DEFAULT 0,
  block_count INTEGER DEFAULT 0,
  head_count INTEGER DEFAULT 0,
  head_count_kv INTEGER DEFAULT 0,
  ffn_dim INTEGER DEFAULT 0,
  file_type INTEGER DEFAULT 0,
  batch_size INTEGER DEFAULT 512,
  threads INTEGER DEFAULT 4,
  favorite INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);
```

### 3.2 Column Documentation

#### id

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | PRIMARY KEY |
| Nullable | No |

The unique identifier for each model entry. This value is auto-generated using a timestamp and random suffix pattern: `model_{timestamp}_{random}`. The primary key constraint ensures uniqueness and provides fast lookups by ID.

**Example values:**
```
model_1704112345_abc123def
model_1704112400_xyz789ghi
```

#### name

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NOT NULL |
| Indexed | Yes (idx_models_name) |

The display name of the model. This is typically the filename of the GGUF model file without the extension. The name is used throughout the UI for model identification and should be human-readable.

**Example values:**
```
llama-2-7b-chat.Q4_K_M.gguf
mistral-7b-instruct-v0.1.Q5_K_M.gguf
codellama-13b.Q4_K_M.gguf
```

#### type

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | DEFAULT 'llama' |
| Nullable | No |

The model architecture type. This field categorizes the model by its underlying architecture, which affects inference behavior and compatible operations.

**Example values:**
```
llama
mistral
qwen
phi
gemma
```

#### status

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | DEFAULT 'idle' |
| Indexed | Yes (idx_models_status) |
| Nullable | No |

The current operational status of the model. This field is critical for tracking which models are loaded and available for inference.

**Example values:**
```
idle
loaded
loading
error
unloaded
```

#### parameters

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | DEFAULT '{}' |
| Nullable | No |

A JSON-encoded object containing model parameters and hyperparameters. This flexible field stores various configuration options that may vary between model types.

**Example JSON structure:**
```json
{
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 40,
  "repeat_penalty": 1.1
}
```

#### model_path

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NULL allowed |
| Nullable | Yes |

The filesystem path to the model file. This path references the actual GGUF file location on disk. When models are scanned, this path is used to verify file existence and extract metadata.

**Example values:**
```
/home/user/models/llama-2-7b-chat.Q4_K_M.gguf
C:\Users\admin\models\mistral-7b-instruct.Q5_K_M.gguf
```

#### file_size

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | NULL allowed |
| Nullable | Yes |

The size of the model file in bytes. This value is used for disk space calculations and model selection based on available resources. It is extracted from the filesystem during model scanning.

**Example values:**
```
4268994560  (4.0 GB)
8522182656  (7.9 GB)
2147483648  (2.0 GB)
```

#### params

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NULL allowed |
| Nullable | Yes |

A JSON-encoded object containing model architecture parameters. This information is extracted from the GGUF file header during the scanning process and provides details about the model's internal structure.

**Example JSON structure:**
```json
{
  "vocab_size": 32000,
  "hidden_size": 4096,
  "intermediate_size": 11008,
  "num_attention_heads": 32,
  "num_hidden_layers": 32
}
```

#### quantization

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NULL allowed |
| Nullable | Yes |

The quantization method used for the model file. This indicates how the model weights have been quantized to reduce file size and memory requirements.

**Example values:**
```
Q4_K_M
Q5_K_M
Q6_K
Q8_0
F16
```

#### ctx_size

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 4096 |
| Nullable | No |

The default context window size for this model in tokens. This determines how many tokens can be processed in a single inference request. Larger context sizes require more memory but enable longer input sequences.

**Example values:**
```
2048
4096
8192
16384
32768
```

#### embedding_size

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 0 |
| Nullable | No |

The embedding dimension of the model. This value represents the size of the hidden state vectors produced by the model's embedding layer. A value of 0 indicates the field was not populated during scanning.

**Example values:**
```
0
4096
5120
8192
```

#### block_count

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 0 |
| Nullable | No |

The number of transformer blocks (layers) in the model. This corresponds to the depth of the neural network. A value of 0 indicates the field was not populated during scanning.

**Example values:**
```
0
32
48
```

#### head_count

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 0 |
| Nullable | No |

The number of attention heads per layer. This determines how the model's attention mechanism is parallelized. A value of 0 indicates the field was not populated during scanning.

**Example values:**
```
0
32
40
```

#### head_count_kv

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 0 |
| Nullable | No |

The number of key-value heads for grouped-query attention. This is relevant for models using grouped-query attention optimization. A value of 0 indicates standard multi-head attention.

**Example values:**
```
0
8
32
```

#### ffn_dim

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 0 |
| Nullable | No |

The feed-forward network dimension. This represents the size of the intermediate layer in each transformer block. A value of 0 indicates the field was not populated during scanning.

**Example values:**
```
0
11008
14336
```

#### file_type

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 0 |
| Nullable | No |

The GGUF file type identifier. This numeric code indicates the specific format variant of the GGUF file. A value of 0 indicates the field was not populated during scanning.

**Example values:**
```
0
1
7
15
```

#### batch_size

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 512 |
| Nullable | No |

The default batch size for inference operations. This controls how many tokens are processed in parallel during batched inference requests.

**Example values:**
```
512
1024
2048
```

#### threads

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 4 |
| Nullable | No |

The recommended number of CPU threads for inference. This value suggests optimal thread count based on the model's requirements and system capabilities.

**Example values:**
```
4
8
16
32
```

#### favorite

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT 0 |
| Nullable | No |

A boolean flag indicating whether the model is marked as a favorite. This allows users to quickly access frequently used models. Stored as 0 or 1 for SQLite compatibility.

**Example values:**
```
0 (not favorite)
1 (favorite)
```

#### created_at

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | NULL allowed |
| Indexed | Yes (idx_models_created) |
| Nullable | Yes |

The Unix timestamp (seconds since epoch) when the model entry was created. This value is set automatically when a new model is saved to the database.

**Example values:**
```
1704112345
1704200000
1704305000
```

#### updated_at

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | NULL allowed |
| Nullable | Yes |

The Unix timestamp (seconds since epoch) when the model entry was last modified. This value is updated automatically whenever any field of the model is changed through the update method.

**Example values:**
```
1704112345
1704200100
1704306000
```

---

## 4. Metrics Table

### 4.1 Table Definition

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cpu_usage REAL,
  memory_usage REAL,
  disk_usage REAL,
  active_models INTEGER,
  uptime REAL,
  gpu_usage REAL DEFAULT 0,
  gpu_memory_used REAL DEFAULT 0,
  gpu_memory_total REAL DEFAULT 0,
  swap_usage REAL DEFAULT 0,
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### 4.2 Column Documentation

#### id

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | PRIMARY KEY AUTOINCREMENT |
| Nullable | No |

The unique identifier for each metrics entry. This auto-incrementing primary key provides a stable reference for each time-series data point.

#### cpu_usage

| Property | Value |
|----------|-------|
| Type | REAL |
| Constraint | NULL allowed |
| Nullable | Yes |

The current CPU usage as a percentage (0-100). This value represents the total CPU utilization across all cores for the llama-server process.

**Example values:**
```
25.5
45.2
99.9
```

#### memory_usage

| Property | Value |
|----------|-------|
| Type | REAL |
| Constraint | NULL allowed |
| Nullable | Yes |

The current memory (RAM) usage as a percentage (0-100). This represents the portion of available system memory being used by the application.

**Example values:**
```
40.0
65.3
85.7
```

#### disk_usage

| Property | Value |
|----------|-------|
| Type | REAL |
| Constraint | NULL allowed |
| Nullable | Yes |

The current disk usage as a percentage (0-100). This represents the portion of disk space used on the partition containing the models directory.

**Example values:**
```
45.0
72.3
91.2
```

#### active_models

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | NULL allowed |
| Nullable | Yes |

The number of models currently loaded in memory. This counter reflects how many models are actively consuming memory and are available for immediate inference.

**Example values:**
```
0
1
3
5
```

#### uptime

| Property | Value |
|----------|-------|
| Type | REAL |
| Constraint | NULL allowed |
| Nullable | Yes |

The llama-server process uptime in seconds. This value indicates how long the server has been running since the last restart.

**Example values:**
```
3600.0
86400.0
172800.5
```

#### gpu_usage

| Property | Value |
|----------|-------|
| Type | REAL |
| Constraint | DEFAULT 0 |
| Nullable | No |

The GPU utilization percentage (0-100). This value represents the GPU compute utilization when GPU acceleration is enabled. Default value is 0 for systems without GPU support.

**Example values:**
```
0 (no GPU)
45.5
78.2
99.0
```

#### gpu_memory_used

| Property | Value |
|----------|-------|
| Type | REAL |
| Constraint | DEFAULT 0 |
| Nullable | No |

The amount of GPU memory currently in use, in megabytes. This tracks VRAM consumption for models using GPU acceleration. Default value is 0 for systems without GPU.

**Example values:**
```
0 (no GPU)
2048.0
6144.0
16384.0
```

#### gpu_memory_total

| Property | Value |
|----------|-------|
| Type | REAL |
| Constraint | DEFAULT 0 |
| Nullable | No |

The total available GPU memory in megabytes. This represents the maximum VRAM available on the GPU. Default value is 0 for systems without GPU.

**Example values:**
```
0 (no GPU)
8192.0
24576.0
49152.0
```

#### swap_usage

| Property | Value |
|----------|-------|
| Type | REAL |
| Constraint | DEFAULT 0 |
| Nullable | No |

The swap space usage as a percentage (0-100). This tracks how much swap memory is being used, which can indicate memory pressure. Default value is 0.

**Example values:**
```
0.0
15.5
45.2
```

#### timestamp

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT (strftime('%s', 'now')) |
| Indexed | Yes (idx_metrics_timestamp) |
| Nullable | No |

The Unix timestamp (seconds since epoch) when this metrics snapshot was captured. This value is auto-generated using SQLite's strftime function and is indexed for efficient time-based queries.

**Example values:**
```
1704112345
1704200000
1704305000
```

---

## 5. Logs Table

### 5.1 Table Definition

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### 5.2 Column Documentation

#### id

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | PRIMARY KEY AUTOINCREMENT |
| Nullable | No |

The unique identifier for each log entry. This auto-incrementing primary key provides a stable reference for each log entry.

#### level

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NOT NULL |
| Indexed | Yes (idx_logs_level) |
| Nullable | No |

The severity level of the log entry. This field is used for filtering logs by importance and determining how they should be displayed.

**Example values:**
```
debug
info
warn
error
critical
```

#### message

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NOT NULL |
| Nullable | No |

The log message content. This contains the actual log information, which can vary in length depending on the event being logged.

**Example values:**
```
Model loaded successfully: llama-2-7b-chat.Q4_K_M.gguf
Failed to load model: file not found
Connection established to llama-server
```

#### source

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NULL allowed |
| Indexed | Yes (idx_logs_source) |
| Nullable | Yes |

The component or service that generated the log entry. This field helps identify where the log originated from within the application.

**Example values:**
```
server
models
llama-server
router
api
```

#### timestamp

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | DEFAULT (strftime('%s', 'now')) |
| Indexed | Yes (idx_logs_timestamp) |
| Nullable | No |

The Unix timestamp (seconds since epoch) when this log entry was created. This value is auto-generated using SQLite's strftime function and is indexed for efficient time-based queries and log retrieval.

**Example values:**
```
1704112345
1704200000
1704305000
```

---

## 6. Server Config Table

### 6.1 Table Definition

```sql
CREATE TABLE server_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

### 6.2 Column Documentation

#### key

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | PRIMARY KEY |
| Nullable | No |

The configuration key name. This is a unique identifier for each configuration setting stored in the database. The primary key constraint ensures no duplicate configuration keys can exist.

**Example values:**
```
config
serverPath
port
host
```

#### value

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NOT NULL |
| Nullable | No |

The configuration value stored as JSON. This field contains the serialized JSON representation of the configuration value, allowing complex nested configurations to be stored.

**Example values:**
```json
{
  "serverPath": "/usr/local/bin/llama-server",
  "host": "localhost",
  "port": 8080,
  "baseModelsPath": "/home/user/models",
  "ctx_size": 2048,
  "batch_size": 512,
  "threads": 4
}
```

---

## 7. Metadata Table

### 7.1 Table Definition

```sql
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER);
```

### 7.2 Column Documentation

#### key

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | PRIMARY KEY |
| Indexed | Yes (idx_metadata_key) |
| Nullable | No |

The metadata key name. This unique identifier is used to store and retrieve arbitrary key-value data. The primary key constraint ensures uniqueness.

**Example values:**
```
lastScanTime
modelCacheVersion
userPreferences
```

#### value

| Property | Value |
|----------|-------|
| Type | TEXT |
| Constraint | NOT NULL |
| Nullable | No |

The metadata value stored as JSON. This field contains the serialized JSON representation of the value, allowing any data type to be stored.

**Example values:**
```json
1704112345
{"theme": "dark", "language": "en"}
{"recentModels": ["model1", "model2"]}
```

#### updated_at

| Property | Value |
|----------|-------|
| Type | INTEGER |
| Constraint | NULL allowed |
| Nullable | Yes |

The Unix timestamp (seconds since epoch) when this metadata entry was last updated. This value is automatically set when the set method is called.

**Example values:**
```
1704112345
1704200000
1704305000
```

---

## 8. Indexes

### 8.1 Index Definitions

The following indexes are created automatically when the database is initialized. These indexes are critical for query performance, especially for filtering and sorting operations that would otherwise require full table scans.

| Index Name | Table | Columns | Purpose |
|------------|-------|---------|---------|
| idx_models_status | models | status | Enables fast filtering of models by their operational status. Used when displaying loaded models, idle models, or models with errors. |
| idx_models_name | models | name | Enables fast name lookups and alphabetical sorting. Used for model search functionality and name-based filtering. |
| idx_models_created | models | created_at DESC | Enables fast retrieval of recently added models. The DESC ordering optimizes for "newest first" queries common in the UI. |
| idx_metrics_timestamp | metrics | timestamp DESC | Enables efficient time-series queries. Essential for retrieving metrics in time order, especially for charting and monitoring dashboards. |
| idx_logs_timestamp | logs | timestamp DESC | Enables fast retrieval of recent log entries. Optimized for "newest first" log display in the logs viewer. |
| idx_logs_source | logs | source | Enables filtering logs by component source. Useful for viewing logs specific to models, router, or server components. |
| idx_logs_level | logs | level | Enables filtering logs by severity level. Critical for the debug/info/warn/error filtering functionality. |
| idx_metadata_key | metadata | key | Enables fast metadata key lookups. Used whenever metadata is accessed by key for configuration or caching purposes. |

### 8.2 Index Performance Considerations

Understanding when and how indexes are used helps in writing efficient queries:

- **Equality filters** (WHERE status = 'loaded'): The idx_models_status index is used for exact match queries
- **Range queries** (WHERE timestamp > X): The timestamp indexes support range scans efficiently
- **Sorting** (ORDER BY created_at DESC): The idx_models_created index eliminates the need for a sort operation
- **Combined queries** (WHERE status = 'loaded' AND name LIKE '%test%'): Indexes can be used for individual columns, but composite indexes would be needed for optimal combined filtering

---

## 9. Repository API

The database layer follows a Repository Pattern where each table has a dedicated repository class encapsulating all database operations. The main DB class provides a unified API that delegates to these repositories.

### 9.1 ModelsRepository

The ModelsRepository handles all CRUD operations for model entries. It provides methods for querying, inserting, updating, and deleting model records.

#### getAll()

**Signature:** `getAll() -> Array<Object>`

**Description:** Retrieves all models from the database, ordered by creation date descending (newest first).

**Returns:** An array of model objects, or an empty array if no models exist.

**Example:**
```javascript
const models = db.models.getAll();
models.forEach(model => {
  console.log(`${model.name}: ${model.status}`);
});
```

#### getById(id)

**Signature:** `getById(id: string) -> Object|null`

**Description:** Retrieves a single model by its unique identifier. This is the primary method for accessing model details after obtaining an ID from other operations.

**Parameters:**
- `id` (string): The unique model identifier

**Returns:** The model object if found, or null if no model with the given ID exists.

**Example:**
```javascript
const model = db.models.getById('model_1704112345_abc123def');
if (model) {
  console.log(`Model: ${model.name}, Status: ${model.status}`);
}
```

#### save(model)

**Signature:** `save(model: Object) -> Object`

**Description:** Inserts or updates a model record. If the model has an ID that already exists in the database, the record is replaced. If no ID is provided, a new ID is generated using the pattern `model_{timestamp}_{random}`.

**Parameters:**
- `model` (Object): The model data to save

**Returns:** The saved model object with its ID and timestamps populated.

**Example:**
```javascript
const savedModel = db.models.save({
  name: 'llama-2-7b.Q4_K_M.gguf',
  type: 'llama',
  status: 'idle',
  file_size: 4268994560,
  model_path: '/models/llama-2-7b.Q4_K_M.gguf'
});
console.log(`Created model with ID: ${savedModel.id}`);
```

#### update(id, updates)

**Signature:** `update(id: string, updates: Object) -> Object|null`

**Description:** Performs a partial update on an existing model record. Only the fields specified in the updates object are modified. The updated_at timestamp is automatically updated. The operation is wrapped in a transaction for consistency.

**Parameters:**
- `id` (string): The unique model identifier
- `updates` (Object): An object containing the fields to update

**Returns:** The updated model object if successful, or null if the model was not found or no valid updates were provided.

**Example:**
```javascript
const updated = db.models.update('model_1704112345_abc123def', {
  status: 'loaded',
  favorite: 1
});
if (updated) {
  console.log(`Model ${updated.name} is now ${updated.status}`);
}
```

#### delete(id)

**Signature:** `delete(id: string) -> boolean`

**Description:** Deletes a model record from the database by its unique identifier.

**Parameters:**
- `id` (string): The unique model identifier

**Returns:** true if a record was deleted, false if no record with the given ID existed.

**Example:**
```javascript
const deleted = db.models.delete('model_1704112345_abc123def');
if (deleted) {
  console.log('Model deleted successfully');
}
```

#### cleanupMissingFiles()

**Signature:** `cleanupMissingFiles() -> number`

**Description:** Scans all models and removes entries whose model files no longer exist on disk. This method validates each model against the filesystem and removes orphaned records. The operation is wrapped in a transaction for atomicity.

**Returns:** The number of model records that were deleted.

**Example:**
```javascript
const removed = db.models.cleanupMissingFiles();
console.log(`Cleaned up ${removed} invalid model entries`);
```

#### getFavorites()

**Signature:** `getFavorites() -> Array<Object>`

**Description:** Retrieves all models marked as favorites, ordered alphabetically by name.

**Returns:** An array of favorite model objects.

**Example:**
```javascript
const favorites = db.models.getFavorites();
console.log(`You have ${favorites.length} favorite models`);
```

### 9.2 MetricsRepository

The MetricsRepository handles time-series metrics data, including insertion, retrieval, and maintenance operations.

#### save(metrics)

**Signature:** `save(metrics: Object) -> void`

**Description:** Inserts a new metrics snapshot into the database. All fields are optional; missing fields default to 0 for numeric types.

**Parameters:**
- `metrics` (Object): The metrics data containing cpu_usage, memory_usage, disk_usage, active_models, uptime, gpu_usage, gpu_memory_used, gpu_memory_total, and swap_usage

**Example:**
```javascript
db.metrics.save({
  cpu_usage: 45.5,
  memory_usage: 62.3,
  disk_usage: 40.0,
  active_models: 2,
  uptime: 3600.0,
  gpu_usage: 78.0,
  gpu_memory_used: 8192.0,
  gpu_memory_total: 24576.0,
  swap_usage: 5.2
});
```

#### getHistory(limit)

**Signature:** `getHistory(limit?: number) -> Array<Object>`

**Description:** Retrieves the most recent metrics records in descending time order.

**Parameters:**
- `limit` (number, optional): Maximum number of records to return. Default is 100.

**Returns:** An array of metrics objects, ordered by timestamp descending (newest first).

**Example:**
```javascript
const history = db.metrics.getHistory(24); // Last 24 entries
const avgCpu = history.reduce((sum, m) => sum + (m.cpu_usage || 0), 0) / history.length;
console.log(`Average CPU usage: ${avgCpu.toFixed(1)}%`);
```

#### getLatest()

**Signature:** `getLatest() -> Object|null`

**Description:** Retrieves the most recent metrics snapshot.

**Returns:** The latest metrics object, or null if no metrics exist.

**Example:**
```javascript
const latest = db.metrics.getLatest();
if (latest) {
  console.log(`CPU: ${latest.cpu_usage}%, Memory: ${latest.memory_usage}%`);
}
```

#### prune(maxRecords)

**Signature:** `prune(maxRecords?: number) -> number`

**Description:** Removes old metrics records to keep the database bounded. This method checks if the total record count exceeds the specified maximum and deletes the oldest records if necessary.

**Parameters:**
- `maxRecords` (number, optional): Maximum number of records to retain. Default is 10000.

**Returns:** The number of records deleted.

**Example:**
```javascript
const removed = db.metrics.prune(10000);
console.log(`Pruned ${removed} old metrics records`);
```

### 9.3 LogsRepository

The LogsRepository handles application log entries, including insertion, retrieval, and maintenance operations.

#### getAll(limit)

**Signature:** `getAll(limit?: number) -> Array<Object>`

**Description:** Retrieves the most recent log entries in descending time order.

**Parameters:**
- `limit` (number, optional): Maximum number of log entries to return. Default is 100.

**Returns:** An array of log objects, ordered by timestamp descending.

**Example:**
```javascript
const logs = db.logs.getAll(50);
logs.forEach(log => {
  console.log(`[${log.timestamp}] ${log.level}: ${log.message}`);
});
```

#### add(level, message, source)

**Signature:** `add(level: string, message: string, source?: string) -> void`

**Description:** Inserts a new log entry into the database.

**Parameters:**
- `level` (string): The log severity level (debug, info, warn, error, critical)
- `message` (string): The log message content
- `source` (string, optional): The component that generated the log. Default is 'server'.

**Example:**
```javascript
db.logs.add('info', 'Model loaded successfully', 'models');
db.logs.add('error', 'Failed to connect to llama-server', 'server');
```

#### clear()

**Signature:** `clear() -> number`

**Description:** Deletes all log entries from the database.

**Returns:** The number of log entries that were deleted.

**Example:**
```javascript
const deleted = db.logs.clear();
console.log(`Cleared ${deleted} log entries`);
```

### 9.4 ConfigRepository

The ConfigRepository manages server configuration storage and retrieval, with built-in default values.

#### get()

**Signature:** `get() -> Object`

**Description:** Retrieves the server configuration with defaults applied. If no configuration is stored in the database, the default configuration is returned. Otherwise, saved values override defaults.

**Returns:** The complete configuration object including all default values merged with saved values.

**Example:**
```javascript
const config = db.config.get();
console.log(`Server running at ${config.host}:${config.port}`);
console.log(`Models directory: ${config.baseModelsPath}`);
```

**Default Configuration:**
```javascript
{
  serverPath: "/usr/local/bin/llama-server",
  host: "localhost",
  port: 8080,
  baseModelsPath: path.join(os.homedir(), "models"),
  ctx_size: 2048,
  batch_size: 512,
  threads: 4,
  llama_server_enabled: true,
  llama_server_port: 8080,
  llama_server_host: "0.0.0.0",
  llama_server_metrics: true
}
```

#### save(config)

**Signature:** `save(config: Object) -> void`

**Description:** Saves the complete server configuration to the database. The configuration object is serialized as JSON before storage.

**Parameters:**
- `config` (Object): The complete configuration to save

**Example:**
```javascript
db.config.save({
  serverPath: "/custom/path/llama-server",
  host: "0.0.0.0",
  port: 8080,
  baseModelsPath: "/data/models",
  ctx_size: 4096,
  batch_size: 512,
  threads: 8
});
```

### 9.5 MetadataRepository

The MetadataRepository provides key-value storage for arbitrary application metadata, with JSON support for complex values.

#### get(key, defaultValue)

**Signature:** `get(key: string, defaultValue?: *) -> *`

**Description:** Retrieves a metadata value by key. If the key does not exist, the default value is returned. Values are automatically parsed from JSON.

**Parameters:**
- `key` (string): The metadata key to retrieve
- `defaultValue` (any, optional): Value to return if key does not exist

**Returns:** The parsed metadata value, or the default value if the key does not exist.

**Example:**
```javascript
const lastScan = db.meta.get('lastScanTime', 0);
console.log(`Last scan: ${new Date(lastScan * 1000).toLocaleString()}`);

const prefs = db.meta.get('userPreferences', {});
console.log(`User theme: ${prefs.theme || 'default'}`);
```

#### set(key, value)

**Signature:** `set(key: string, value: *) -> void`

**Description:** Sets a metadata value. Complex values are automatically serialized to JSON. The updated_at timestamp is automatically set to the current time.

**Parameters:**
- `key` (string): The metadata key to set
- `value` (any): The value to store (any JSON-serializable type)

**Example:**
```javascript
db.meta.set('lastScanTime', Math.floor(Date.now() / 1000));
db.meta.set('userPreferences', { theme: 'dark', language: 'en' });
db.meta.set('recentModels', ['model1', 'model2', 'model3']);
```

---

## 10. Query Examples

### 10.1 Get Models by Status

```sql
-- Get all loaded models
SELECT * FROM models WHERE status = 'loaded';

-- Get all idle models ordered by name
SELECT * FROM models WHERE status = 'idle' ORDER BY name ASC;

-- Get models with error status
SELECT * FROM models WHERE status = 'error';
```

**JavaScript equivalent:**
```javascript
const models = db.models.getAll().filter(m => m.status === 'loaded');
```

### 10.2 Get Metrics for Last Hour

```sql
-- Get metrics from the last hour (3600 seconds)
SELECT * FROM metrics
WHERE timestamp >= strftime('%s', 'now') - 3600
ORDER BY timestamp DESC;

-- Get average metrics over the last hour
SELECT
  AVG(cpu_usage) as avg_cpu,
  AVG(memory_usage) as avg_memory,
  AVG(gpu_usage) as avg_gpu
FROM metrics
WHERE timestamp >= strftime('%s', 'now') - 3600;
```

### 10.3 Get Logs by Level

```sql
-- Get all error and critical logs
SELECT * FROM logs
WHERE level IN ('error', 'critical')
ORDER BY timestamp DESC
LIMIT 100;

-- Get logs from a specific source
SELECT * FROM logs
WHERE source = 'llama-server'
ORDER BY timestamp DESC
LIMIT 50;

-- Get recent error logs with their timestamps
SELECT id, level, message, timestamp FROM logs
WHERE level = 'error'
ORDER BY timestamp DESC
LIMIT 20;
```

### 10.4 Count Active Models

```sql
-- Count loaded models
SELECT COUNT(*) as count FROM models WHERE status = 'loaded';

-- Get status distribution
SELECT status, COUNT(*) as count
FROM models
GROUP BY status;
```

**JavaScript equivalent:**
```javascript
const models = db.models.getAll();
const loadedCount = models.filter(m => m.status === 'loaded').length;
const statusCounts = models.reduce((acc, m) => {
  acc[m.status] = (acc[m.status] || 0) + 1;
  return acc;
}, {});
```

### 10.5 Get Model with Highest File Size

```sql
-- Get the largest model by file size
SELECT * FROM models
WHERE file_size IS NOT NULL
ORDER BY file_size DESC
LIMIT 1;

-- Get models sorted by file size descending
SELECT id, name, file_size, quantization
FROM models
WHERE file_size IS NOT NULL
ORDER BY file_size DESC;
```

**JavaScript equivalent:**
```javascript
const models = db.models.getAll();
const largest = models.reduce((max, m) =>
  (!max || (m.file_size && m.file_size > max.file_size)) ? m : max,
  null
);
```

### 10.6 Complex Query: Models with Statistics

```sql
-- Get model summary with usage statistics
SELECT
  m.id,
  m.name,
  m.status,
  m.file_size,
  COUNT(DISTINCT mt.id) as metrics_samples,
  COUNT(DISTINCT l.id) as log_entries
FROM models m
LEFT JOIN metrics mt ON mt.active_models > 0
LEFT JOIN logs l ON l.source = m.name
GROUP BY m.id
ORDER BY m.created_at DESC;
```

---

## 11. Performance Tips

### 11.1 When to Use Indexes

Indexes are most effective in the following scenarios:

- **Frequently filtered columns**: Columns used in WHERE clauses should be indexed. In this schema, status, level, source, and timestamp are commonly filtered and are indexed.

- **Sorted columns**: Columns used in ORDER BY clauses benefit from indexes. The created_at DESC and timestamp DESC indexes optimize sorting operations.

- **Unique enforcement**: Primary key columns are automatically indexed by SQLite, providing fast lookups for getById operations.

- **Join conditions**: If foreign key relationships were added, indexed columns would improve join performance.

### 11.2 Avoiding Full Table Scans

Full table scans occur when queries cannot use indexes and must examine every row. To avoid them:

**Good patterns:**
```javascript
// Use indexed columns for filtering
db.models.getAll().filter(m => m.status === 'loaded');

// Use indexed columns for sorting
db.models.getAll().sort((a, b) => b.created_at - a.created_at);
```

**Avoid patterns that bypass indexes:**
```javascript
// Avoid filtering on non-indexed columns
db.models.getAll().filter(m => m.file_size > 4000000000);

// Instead, use SQL WHERE clause through raw query if needed
const db.exec("SELECT * FROM models WHERE file_size > 4000000000");
```

### 11.3 Pagination Strategies

For efficient pagination with large datasets, use keyset pagination (also known as cursor-based pagination) instead of OFFSET-based pagination:

**Cursor-based pagination (recommended):**
```javascript
// Get first page
const page1 = db.prepare("SELECT * FROM models ORDER BY created_at DESC LIMIT 20").all();

// Get next page using the last cursor
const lastCreated = page1[page1.length - 1].created_at;
const page2 = db.prepare(
  "SELECT * FROM models WHERE created_at < ? ORDER BY created_at DESC LIMIT 20"
).all(lastCreated);
```

**Offset-based pagination (use sparingly):**
```javascript
// Works but degrades with large offsets
const page = db.prepare("SELECT * FROM models ORDER BY created_at DESC LIMIT 20 OFFSET 40").all();
```

### 11.4 Bulk Insert Optimization

For inserting multiple records efficiently, use transactions:

```javascript
const insertMany = db.transaction((models) => {
  for (const model of models) {
    db.models.save(model);
  }
});

insertMany([
  { name: 'model1.gguf', status: 'idle' },
  { name: 'model2.gguf', status: 'idle' },
  { name: 'model3.gguf', status: 'idle' }
]);
```

For metrics, which are frequently inserted, batch inserts are even more important:

```javascript
const insertMetrics = db.transaction((metricsArray) => {
  const stmt = db.prepare(
    `INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, active_models, uptime)
     VALUES (?, ?, ?, ?, ?)`
  );
  for (const m of metricsArray) {
    stmt.run(m.cpu_usage, m.memory_usage, m.disk_usage, m.active_models, m.uptime);
  }
});

insertMetrics([
  { cpu_usage: 25, memory_usage: 40, disk_usage: 45, active_models: 1, uptime: 100 },
  { cpu_usage: 30, memory_usage: 42, disk_usage: 45, active_models: 1, uptime: 101 },
  { cpu_usage: 28, memory_usage: 41, disk_usage: 45, active_models: 1, uptime: 102 }
]);
```

### 11.5 Query Optimization Checklist

1. **Use specific column names**: Instead of SELECT *, list only the columns needed
2. **Limit result sets**: Always use LIMIT for queries that could return many rows
3. **Use appropriate indexes**: Ensure WHERE, ORDER BY, and JOIN columns are indexed
4. **Avoid functions on indexed columns**: WHERE date(timestamp/1000, 'unixepoch') may not use indexes
5. **Prune old data regularly**: Use the metrics.prune() method to keep metrics table bounded

---

## 12. Backup and Restore

### 12.1 How to Backup Database

The application provides a built-in command for creating database backups:

```bash
# Using pnpm (recommended)
pnpm db:export
```

This command creates a timestamped backup file in the designated backup directory. The backup includes all tables, indexes, and data.

For manual backups, use the following methods:

**Method 1: File Copy (while server is stopped)**
```bash
# Stop the server first
cp data/llama-dashboard.db backup/llama-dashboard-$(date +%Y%m%d-%H%M%S).db
```

**Method 2: SQLite Dump (works while server is running)**
```bash
sqlite3 data/llama-dashboard.db ".backup backup/llama-dashboard-live.db"
```

**Method 3: SQL Export**
```bash
sqlite3 data/llama-dashboard.db ".dump" > backup/llama-dashboard-$(date +%Y%m%d).sql
```

### 12.2 How to Restore Database

To restore from a backup, follow these steps:

**Method 1: File Replacement (server must be stopped)**
```bash
# Stop the server
# Make a backup of current state just in case
cp data/llama-dashboard.db data/llama-dashboard.db.backup

# Restore from backup
cp backup/llama-dashboard-20240101.db data/llama-dashboard.db

# Start the server
pnpm start
```

**Method 2: Import from SQL Dump**
```bash
# Stop the server
# Create a fresh database
rm data/llama-dashboard.db
sqlite3 data/llama-dashboard.db < backup/llama-dashboard-20240101.sql

# Start the server
pnpm start
```

**Method 3: Attach and Copy**
```bash
sqlite3 data/llama-dashboard.db
SQLite> ATTACH DATABASE 'backup/llama-dashboard-backup.db' AS backup;
SQLite> BEGIN;
SQLite> DELETE FROM models;  -- Clear current data
SQLite> INSERT INTO models SELECT * FROM backup.models;
SQLite> COMMIT;
SQLite> DETACH DATABASE backup;
```

### 12.3 Migration Procedures

When upgrading to a new version of the application that includes schema changes, the migrations are applied automatically on startup.

**Manual migration (if needed):**

If automatic migration fails or you need to apply migrations manually:

```bash
# Check current schema version
sqlite3 data/llama-dashboard.db "PRAGMA table_info(models);"

# Apply specific migration manually
sqlite3 data/llama-dashboard.db "ALTER TABLE models ADD COLUMN new_column TEXT DEFAULT '';"
```

**Migration best practices:**

1. **Always backup before upgrading**: Run `pnpm db:export` before applying updates
2. **Test migrations on a copy**: Restore a backup to a test database first
3. **Check migration logs**: Review application logs for migration status
4. **Keep old backups**: Retain backups from before and after migration

**Version-specific migrations:**

The following migrations have been applied to this database:

| Version | Tables Affected | Description |
|---------|----------------|-------------|
| Initial | models, metrics, logs, server_config, metadata | Initial schema creation |
| 1.1 | models | Added embedding_size, block_count, head_count, head_count_kv, ffn_dim, file_type, favorite |
| 1.2 | metrics | Added gpu_usage, gpu_memory_used, gpu_memory_total, swap_usage |

---

## Appendix A: Quick Reference

### Table Summary

| Table | Purpose | Primary Key | Foreign Keys | Row Estimate |
|-------|---------|-------------|--------------|--------------|
| models | Model metadata and configuration | id (TEXT) | None | 10-100 |
| metrics | Time-series performance data | id (INTEGER AUTOINC) | None | 10,000-100,000 |
| logs | Application and system logs | id (INTEGER AUTOINC) | None | 1,000-100,000 |
| server_config | Server configuration | key (TEXT) | None | 1 |
| metadata | Arbitrary key-value storage | key (TEXT) | None | 10-50 |

### Default Values Reference

| Column | Default Value |
|--------|---------------|
| models.type | 'llama' |
| models.status | 'idle' |
| models.parameters | '{}' |
| models.ctx_size | 4096 |
| models.embedding_size | 0 |
| models.block_count | 0 |
| models.head_count | 0 |
| models.head_count_kv | 0 |
| models.ffn_dim | 0 |
| models.file_type | 0 |
| models.batch_size | 512 |
| models.threads | 4 |
| models.favorite | 0 |
| metrics.gpu_usage | 0 |
| metrics.gpu_memory_used | 0 |
| metrics.gpu_memory_total | 0 |
| metrics.swap_usage | 0 |

### Common Operations Reference

| Operation | Repository | Method |
|-----------|------------|--------|
| Get all models | ModelsRepository | `getAll()` |
| Get model by ID | ModelsRepository | `getById(id)` |
| Save model | ModelsRepository | `save(model)` |
| Update model | ModelsRepository | `update(id, updates)` |
| Delete model | ModelsRepository | `delete(id)` |
| Save metrics | MetricsRepository | `save(metrics)` |
| Get metrics history | MetricsRepository | `getHistory(limit)` |
| Get latest metrics | MetricsRepository | `getLatest()` |
| Prune old metrics | MetricsRepository | `prune(maxRecords)` |
| Get logs | LogsRepository | `getAll(limit)` |
| Add log | LogsRepository | `add(level, message, source)` |
| Clear logs | LogsRepository | `clear()` |
| Get config | ConfigRepository | `get()` |
| Save config | ConfigRepository | `save(config)` |
| Get metadata | MetadataRepository | `get(key, default)` |
| Set metadata | MetadataRepository | `set(key, value)` |

---

## Appendix B: Troubleshooting

### Database Lock Issues

If you encounter "database is locked" errors:

1. Ensure the server is not running multiple instances
2. Close any external SQLite connections (DB Browser, CLI)
3. Check for unclosed transactions in the code

### Corruption Recovery

If the database becomes corrupted:

```bash
# Try SQLite recovery
sqlite3 data/llama-dashboard.db ".recover" > recovery.sql
sqlite3 data/llama-dashboard.db.recovered < recovery.sql
mv data/llama-dashboard.db data/llama-dashboard.db.corrupted
mv data/llama-dashboard.db.recovered data/llama-dashboard.db
```

If recovery fails, restore from the last known good backup.

### Performance Issues

If the database becomes slow:

1. Run `ANALYZE` to update index statistics: `sqlite3 data/llama-dashboard.db "ANALYZE;"`
2. Prune old metrics records: `db.metrics.prune(10000)`
3. Consider adding more indexes for frequently used query patterns
