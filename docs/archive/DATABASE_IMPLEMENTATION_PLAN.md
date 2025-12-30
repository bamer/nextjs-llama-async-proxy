# Database Integration Implementation Plan

## 📋 Overview

This plan provides step-by-step instructions for integrating the SQLite database that stores:
- **Metrics History** (last 10 minutes for chart restoration)
- **Model Configurations** (100+ llama-server parameters per model)
- **Dashboard Metadata** (theme preferences, server state)

---

## 🎯 Objectives

1. ✅ Install `better-sqlite3` package
2. ✅ Create database schema with 2 tables
3. ✅ Implement TypeScript API for all CRUD operations
4. ✅ Integrate database with WebSocket metrics handler
5. ✅ Connect database to model management UI
6. ✅ Add database initialization to app startup
7. ✅ Implement auto-cleanup (keep only 10 minutes of metrics)
8. ✅ Test all database operations

---

## 📦 Phase 1: Setup & Installation

### 1.1 Install Dependencies

```bash
pnpm add -D better-sqlite3 @types/better-sqlite3
```

**Why:**
- `better-sqlite3` is the lightest SQLite library (~800 KB)
- Synchronous API (perfect for dashboard use case)
- WAL journal mode for better write performance
- Full TypeScript support

### 1.2 Create Database Directory

```bash
mkdir -p data
```

**Why:** Store database files separate from source code for easier backups and versioning.

---

## 🏗️ Phase 2: Database Implementation

### 2.1 Create Database File

**File:** `src/lib/database.ts`

**Required Imports:**
```typescript
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
```

### 2.2 Database Initialization Function

```typescript
const DB_PATH = path.join(process.cwd(), 'data', 'llama-dashboard.db');

export function initDatabase(): Database {
  const db = new Database(DB_PATH, {
    readonly: false,
    fileMustExist: false,
    WAL: true, // Write-Ahead Logging for performance
    timeout: 5000,
    verbose: true,
  });

  createTables(db);
  return db;
}

export function closeDatabase(db: Database): void {
  db.close();
}

export function getDatabaseSize(): number {
  const stats = fs.statSync(DB_PATH);
  return stats.size;
}
```

### 2.3 Table Creation Function

```typescript
function createTables(db: Database): void {
  // Metrics History Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      cpu_usage REAL NOT NULL,
      memory_usage REAL NOT NULL,
      disk_usage REAL NOT NULL,
      gpu_usage REAL NOT NULL,
      gpu_temperature REAL NOT NULL,
      gpu_memory_used REAL NOT NULL,
      gpu_memory_total REAL NOT NULL,
      gpu_power_usage REAL NOT NULL,
      active_models INTEGER NOT NULL,
      uptime INTEGER NOT NULL,
      requests_per_minute REAL NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics_history(created_at);
  `);

  // Models Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('running', 'stopped', 'loading', 'error')),
      model_path TEXT,
      model_url TEXT,
      docker_repo TEXT,
      hf_repo TEXT,
      hf_repo_draft TEXT,
      hf_file TEXT,
      hf_file_v TEXT,
      hf_token TEXT,
      ctx_size INTEGER DEFAULT 0,
      predict INTEGER DEFAULT -1,
      batch_size INTEGER DEFAULT 2048,
      ubatch_size INTEGER DEFAULT 512,
      n_parallel INTEGER DEFAULT -1,
      cont_batching INTEGER DEFAULT 0,
      threads INTEGER DEFAULT -1,
      threads_batch INTEGER,
      cpu_mask TEXT,
      cpu_range TEXT,
      cpu_strict INTEGER DEFAULT 0,
      cpu_mask_batch TEXT,
      cpu_range_batch TEXT,
      cpu_strict_batch INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 0,
      priority_batch INTEGER,
      cache_ram INTEGER DEFAULT -1,
      cache_type_k TEXT,
      cache_type_v TEXT,
      mmap INTEGER DEFAULT 0,
      mlock INTEGER DEFAULT 0,
      numa TEXT,
      defrag_thold INTEGER,
      device TEXT,
      list_devices INTEGER DEFAULT 0,
      gpu_layers INTEGER DEFAULT -1,
      split_mode TEXT,
      tensor_split TEXT,
      main_gpu INTEGER,
      kv_offload INTEGER DEFAULT 0,
      repack INTEGER DEFAULT 0,
      no_host INTEGER DEFAULT 0,
      swa_full INTEGER DEFAULT 0,
      override_tensor TEXT,
      cpu_moe INTEGER DEFAULT 0,
      n_cpu_moe INTEGER DEFAULT 0,
      kv_unified INTEGER DEFAULT 0,
      temperature REAL DEFAULT 0.8,
      top_k INTEGER DEFAULT 40,
      top_p REAL DEFAULT 0.9,
      min_p REAL DEFAULT 0.1,
      top_nsigma REAL DEFAULT -1.0,
      xtc_probability REAL DEFAULT 0.0,
      xtc_threshold REAL DEFAULT 0.1,
      typical_p REAL DEFAULT 1.0,
      repeat_last_n INTEGER DEFAULT 64,
      repeat_penalty REAL DEFAULT 1.0,
      presence_penalty REAL DEFAULT 0.0,
      frequency_penalty REAL DEFAULT 0.0,
      dry_multiplier REAL DEFAULT 0.0,
      dry_base REAL DEFAULT 1.75,
      dry_allowed_length INTEGER DEFAULT 2,
      dry_penalty_last_n INTEGER DEFAULT -1,
      dry_sequence_breaker TEXT,
      dynatemp_range REAL DEFAULT 0.0,
      dynatemp_exp REAL DEFAULT 1.0,
      mirostat INTEGER DEFAULT 0,
      mirostat_lr REAL DEFAULT 0.1,
      mirostat_ent REAL DEFAULT 5.0,
      samplers TEXT,
      sampler_seq TEXT DEFAULT 'edskypmxt',
      seed INTEGER DEFAULT -1,
      grammar TEXT,
      grammar_file TEXT,
      json_schema TEXT,
      json_schema_file TEXT,
      ignore_eos INTEGER DEFAULT 1,
      escape BOOLEAN DEFAULT 1,
      rope_scaling_type TEXT,
      rope_scale REAL,
      rope_freq_base REAL,
      rope_freq_scale REAL,
      yarn_orig_ctx INTEGER DEFAULT 0,
      yarn_ext_factor REAL DEFAULT -1.0,
      yarn_attn_factor REAL DEFAULT -1.0,
      yarn_beta_slow REAL DEFAULT -1.0,
      yarn_beta_fast REAL DEFAULT -1.0,
      flash_attn TEXT DEFAULT 'auto',
      mmproj TEXT,
      mmproj_url TEXT,
      mmproj_auto INTEGER DEFAULT 0,
      mmproj_offload INTEGER DEFAULT 0,
      image_min_tokens INTEGER,
      image_max_tokens INTEGER,
      lora TEXT,
      lora_scaled TEXT,
      control_vector TEXT,
      control_vector_scaled TEXT,
      control_vector_layer_range TEXT,
      model_draft TEXT,
      model_url_draft TEXT,
      ctx_size_draft INTEGER,
      threads_draft INTEGER,
      threads_batch_draft INTEGER,
      draft_max INTEGER DEFAULT 16,
      draft_min INTEGER DEFAULT 0,
      draft_p_min REAL DEFAULT 0.8,
      cache_type_k_draft TEXT,
      cache_type_v_draft TEXT,
      cpu_moe_draft INTEGER DEFAULT 0,
      n_cpu_moe_draft INTEGER DEFAULT 0,
      n_gpu_layers_draft INTEGER,
      device_draft TEXT,
      spec_replace TEXT,
      log_disable INTEGER,
      log_file TEXT,
      log_colors TEXT,
      log_verbose INTEGER DEFAULT 0,
      log_prefix INTEGER DEFAULT 0,
      log_timestamps INTEGER DEFAULT 0,
      logit_bias TEXT,
      host TEXT DEFAULT '127.0.0.1',
      port INTEGER DEFAULT 8080,
      api_prefix TEXT,
      path TEXT,
      webui TEXT,
      webui_config_file TEXT,
      no_webui INTEGER DEFAULT 0,
      embeddings INTEGER DEFAULT 0,
      reranking INTEGER DEFAULT 0,
      api_key TEXT,
      api_key_file TEXT,
      ssl_key_file TEXT,
      ssl_cert_file TEXT,
      timeout INTEGER DEFAULT 600,
      threads_http INTEGER,
      cache_reuse INTEGER,
      metrics_enabled INTEGER DEFAULT 1,
      props_enabled INTEGER DEFAULT 0,
      slots_enabled INTEGER DEFAULT 0,
      slot_save_path TEXT,
      media_path TEXT,
      models_dir TEXT,
      models_preset TEXT,
      models_max INTEGER DEFAULT 4,
      models_autoload INTEGER DEFAULT 0,
      jinja INTEGER DEFAULT 0,
      chat_template TEXT,
      chat_template_file TEXT,
      chat_template_kwargs TEXT,
      prefill_assistant INTEGER DEFAULT 0,
      ctx_checkpoints INTEGER DEFAULT 8,
      verbose_prompt INTEGER DEFAULT 0,
      warmup INTEGER DEFAULT 0,
      spm_infill INTEGER DEFAULT 0,
      pooling TEXT,
      context_shift INTEGER DEFAULT 0,
      rpc TEXT,
      offline INTEGER DEFAULT 0,
      override_kv TEXT,
      op_offload INTEGER DEFAULT 0,
      fit TEXT,
      fit_target INTEGER DEFAULT 1024,
      fit_ctx INTEGER DEFAULT 4096,
      check_tensors INTEGER DEFAULT 0,
      no_host INTEGER DEFAULT 0,
      sleep_idle_seconds INTEGER DEFAULT -1,
      polling TEXT,
      polling_batch TEXT,
      reasoning_format TEXT,
      reasoning_budget INTEGER DEFAULT -1,
      custom_params TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
    CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
    CREATE INDEX IF NOT EXISTS idx_models_type ON models(type);
    CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at);
  `);

  // Metadata Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO metadata (key, value, updated_at)
    VALUES ('db_version', '1.0', ${Date.now()});
  `);
}
```

---

## 📊 Phase 3: Metrics History API

### 3.1 Save Metrics Function

```typescript
export interface MetricsData {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  gpu_usage?: number;
  gpu_temperature?: number;
  gpu_memory_used?: number;
  gpu_memory_total?: number;
  gpu_power_usage?: number;
  active_models?: number;
  uptime?: number;
  requests_per_minute?: number;
}

export function saveMetrics(data: MetricsData): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      INSERT INTO metrics_history (
        timestamp, cpu_usage, memory_usage, disk_usage, gpu_usage,
        gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage,
        active_models, uptime, requests_per_minute, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      Date.now(),
      data.cpu_usage ?? 0,
      data.memory_usage ?? 0,
      data.disk_usage ?? 0,
      data.gpu_usage ?? 0,
      data.gpu_temperature ?? 0,
      data.gpu_memory_used ?? 0,
      data.gpu_memory_total ?? 0,
      data.gpu_power_usage ?? 0,
      data.active_models ?? 0,
      data.uptime ?? 0,
      data.requests_per_minute ?? 0,
      Date.now()
    );

    stmt.finalize();

    // Auto-cleanup: Delete records older than 10 minutes
    const cleanupStmt = db.prepare(`
      DELETE FROM metrics_history
      WHERE created_at < ?
    `);

    cleanupStmt.run(Date.now() - (10 * 60 * 1000));
    cleanupStmt.finalize();

  } finally {
    closeDatabase(db);
  }
}
```

### 3.2 Get Metrics History Function

```typescript
export interface MetricsHistoryEntry {
  id: number;
  timestamp: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  gpu_usage: number;
  gpu_temperature: number;
  gpu_memory_used: number;
  gpu_memory_total: number;
  gpu_power_usage: number;
  active_models: number;
  uptime: number;
  requests_per_minute: number;
  created_at: number;
}

export function getMetricsHistory(minutes: number = 10): MetricsHistoryEntry[] {
  const db = initDatabase();
  const cutoffTime = Date.now() - (minutes * 60 * 1000);

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      WHERE created_at >= ?
      ORDER BY timestamp ASC
    `);

    const entries = stmt.all(cutoffTime) as MetricsHistoryEntry[];

    stmt.finalize();
    return entries;

  } finally {
    closeDatabase(db);
  }
}
```

### 3.3 Get Latest Metrics Function

```typescript
export function getLatestMetrics(): MetricsData | null {
  const db = initDatabase();

  try {
    const row = db.prepare(`
      SELECT cpu_usage, memory_usage, disk_usage, gpu_usage,
             gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage,
             active_models, uptime, requests_per_minute
      FROM metrics_history
      ORDER BY timestamp DESC
      LIMIT 1
    `).get();

    if (!row) return null;

    const stmt.finalize();

    return {
      cpu_usage: row[0] as number,
      memory_usage: row[1] as number,
      disk_usage: row[2] as number,
      gpu_usage: row[3] as number,
      gpu_temperature: row[4] as number,
      gpu_memory_used: row[5] as number,
      gpu_memory_total: row[6] as number,
      gpu_power_usage: row[7] as number,
      active_models: row[8] as number,
      uptime: row[9] as number,
      requests_per_minute: row[10] as number,
    };

  } finally {
    closeDatabase(db);
  }
}
```

---

## 🤖 Phase 4: Models Management API

### 4.1 Model Configuration Interface

```typescript
export interface ModelConfig {
  id?: number;
  name: string;
  type: 'llama' | 'gpt' | 'mistrall' | 'custom';
  status: 'running' | 'stopped' | 'loading' | 'error';

  // Model Path & Loading
  model_path?: string;
  model_url?: string;
  docker_repo?: string;
  hf_repo?: string;
  hf_repo_draft?: string;
  hf_file?: string;
  hf_file_v?: string;
  hf_token?: string;

  // Context & Processing
  ctx_size?: number;
  predict?: number;
  batch_size?: number;
  ubatch_size?: number;
  n_parallel?: number;
  cont_batching?: number;
  threads?: number;
  threads_batch?: number;
  cpu_mask?: string;
  cpu_range?: string;
  cpu_strict?: number;
  cpu_mask_batch?: string;
  cpu_range_batch?: string;
  cpu_strict_batch?: number;
  priority?: number;
  priority_batch?: number;

  // Memory & Performance
  cache_ram?: number;
  cache_type_k?: string;
  cache_type_v?: string;
  mmap?: number;
  mlock?: number;
  numa?: string;
  defrag_thold?: number;

  // GPU Offloading
  device?: string;
  list_devices?: number;
  gpu_layers?: number;
  split_mode?: string;
  tensor_split?: string;
  main_gpu?: number;
  kv_offload?: number;
  repack?: number;
  no_host?: number;

  // Advanced Memory
  swa_full?: number;
  override_tensor?: string;
  cpu_moe?: number;
  n_cpu_moe?: number;
  kv_unified?: number;

  // Sampling Parameters
  temperature?: number;
  top_k?: number;
  top_p?: number;
  min_p?: number;
  top_nsigma?: number;
  xtc_probability?: number;
  xtc_threshold?: number;
  typical_p?: number;
  repeat_last_n?: number;
  repeat_penalty?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  dry_multiplier?: number;
  dry_base?: number;
  dry_allowed_length?: number;
  dry_penalty_last_n?: number;
  dry_sequence_breaker?: string;
  dynatemp_range?: number;
  dynatemp_exp?: number;
  mirostat?: number;
  mirostat_lr?: number;
  mirostat_ent?: number;
  samplers?: string;
  sampler_seq?: string;
  seed?: number;

  // Grammar & Constraints
  grammar?: string;
  grammar_file?: string;
  json_schema?: string;
  json_schema_file?: string;
  ignore_eos?: number;
  escape?: boolean;

  // RoPE & Attention
  rope_scaling_type?: string;
  rope_scale?: number;
  rope_freq_base?: number;
  rope_freq_scale?: number;
  yarn_orig_ctx?: number;
  yarn_ext_factor?: number;
  yarn_attn_factor?: number;
  yarn_beta_slow?: number;
  yarn_beta_fast?: number;

  // Multi-modal
  mmproj?: string;
  mmproj_url?: string;
  mmproj_auto?: number;
  mmproj_offload?: number;
  image_min_tokens?: number;
  image_max_tokens?: number;

  // LoRA & Control Vectors
  lora?: string;
  lora_scaled?: string;
  control_vector?: string;
  control_vector_scaled?: string;
  control_vector_layer_range?: string;

  // Draft Model (Speculative Decoding)
  model_draft?: string;
  model_url_draft?: string;
  ctx_size_draft?: number;
  threads_draft?: number;
  threads_batch_draft?: number;
  draft_max?: number;
  draft_min?: number;
  draft_p_min?: number;
  cache_type_k_draft?: string;
  cache_type_v_draft?: string;
  cpu_moe_draft?: number;
  n_cpu_moe_draft?: number;
  n_gpu_layers_draft?: number;
  device_draft?: string;
  spec_replace?: string;

  // Logging
  log_disable?: number;
  log_file?: string;
  log_colors?: string;
  log_verbose?: number;
  log_prefix?: number;
  logit_bias?: string;

  // Server Configuration
  host?: string;
  port?: number;
  api_prefix?: string;
  path?: string;
  webui?: string;
  webui_config_file?: string;
  no_webui?: number;
  embeddings?: number;
  reranking?: number;
  api_key?: string;
  api_key_file?: string;
  ssl_key_file?: string;
  ssl_cert_file?: string;
  timeout?: number;
  threads_http?: number;
  cache_reuse?: number;
  metrics_enabled?: number;
  props_enabled?: number;
  slots_enabled?: number;
  slot_save_path?: string;
  media_path?: string;
  models_dir?: string;
  models_preset?: string;
  models_max?: number;
  models_autoload?: number;
  jinja?: number;
  chat_template?: string;
  chat_template_file?: string;
  chat_template_kwargs?: string;
  prefill_assistant?: number;
  ctx_checkpoints?: number;
  verbose_prompt?: number;
  warmup?: number;
  spm_infill?: number;
  pooling?: string;
  context_shift?: number;
  rpc?: string;
  offline?: number;
  override_kv?: string;
  op_offload?: number;
  fit?: string;
  fit_target?: number;
  fit_ctx?: number;
  check_tensors?: number;
  no_host?: number;
  sleep_idle_seconds?: number;
  polling?: string;
  polling_batch?: string;
  reasoning_format?: string;
  reasoning_budget?: number;

  // Flexible parameters
  custom_params?: string;

  created_at?: number;
  updated_at?: number;
}
```

### 4.2 Save Model Function

```typescript
export function saveModel(config: Omit<ModelConfig, 'id' | 'created_at' | 'updated_at'>): number {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      INSERT INTO models (
        name, type, status,
        model_path, model_url, docker_repo, hf_repo, hf_repo_draft, hf_file, hf_file_v, hf_token,
        ctx_size, predict, batch_size, ubatch_size, n_parallel, cont_batching,
        threads, threads_batch, cpu_mask, cpu_range, cpu_strict, cpu_mask_batch,
        cpu_range_batch, cpu_strict_batch, priority, priority_batch,
        cache_ram, cache_type_k, cache_type_v, mmap, mlock, numa, defrag_thold,
        device, list_devices, gpu_layers, split_mode, tensor_split, main_gpu,
        kv_offload, repack, no_host, swa_full, override_tensor,
        cpu_moe, n_cpu_moe, kv_unified,
        temperature, top_k, top_p, min_p, top_nsigma, xtc_probability, xtc_threshold, typical_p,
        repeat_last_n, repeat_penalty, presence_penalty, frequency_penalty,
        dry_multiplier, dry_base, dry_allowed_length, dry_penalty_last_n, dry_sequence_breaker,
        dynatemp_range, dynatemp_exp, mirostat, mirostat_lr, mirostat_ent,
        samplers, sampler_seq, seed,
        grammar, grammar_file, json_schema, json_schema_file, ignore_eos, escape,
        rope_scaling_type, rope_scale, rope_freq_base, rope_freq_scale,
        yarn_orig_ctx, yarn_ext_factor, yarn_attn_factor, yarn_beta_slow, yarn_beta_fast, flash_attn,
        mmproj, mmproj_url, mmproj_auto, mmproj_offload, image_min_tokens, image_max_tokens,
        lora, lora_scaled, control_vector, control_vector_scaled, control_vector_layer_range,
        model_draft, model_url_draft, ctx_size_draft, threads_draft, threads_batch_draft,
        draft_max, draft_min, draft_p_min, cache_type_k_draft, cache_type_v_draft,
        cpu_moe_draft, n_cpu_moe_draft, n_gpu_layers_draft, device_draft, spec_replace,
        log_disable, log_file, log_colors, log_verbose, log_prefix, logit_bias,
        host, port, api_prefix, path, webui, webui_config_file, no_webui, embeddings,
        reranking, api_key, api_key_file, ssl_key_file, ssl_cert_file,
        timeout, threads_http, cache_reuse, metrics_enabled, props_enabled,
        slots_enabled, slot_save_path, media_path, models_dir, models_preset,
        models_max, models_autoload, jinja, chat_template, chat_template_file, chat_template_kwargs,
        prefill_assistant, ctx_checkpoints, verbose_prompt, warmup, spm_infill,
        pooling, context_shift, rpc, offline, override_kv, op_offload,
        fit, fit_target, fit_ctx, check_tensors, no_host, sleep_idle_seconds,
        polling, polling_batch, reasoning_format, reasoning_budget, custom_params,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = stmt.run(
      Date.now(),
      config.name,
      config.type || 'llama',
      config.status || 'stopped',
      // ... ALL other config properties
      Date.now()
    ) as number;

    stmt.finalize();
    return id;

  } finally {
    closeDatabase(db);
  }
}
```

### 4.3 Get All Models Function

```typescript
export function getModels(filters?: Partial<Pick<ModelConfig, 'status' | 'type' | 'name'>>): ModelConfig[] {
  const db = initDatabase();

  try {
    let query = 'SELECT * FROM models';
    const params: any[] = [];

    if (filters?.status) {
      query += ' WHERE status = ?';
      params.push(filters.status);
    }

    if (filters?.type) {
      query += filters?.status ? ' AND type = ?' : ' WHERE type = ?';
      params.push(filters.type);
    }

    if (filters?.name) {
      query += (filters?.status || filters?.type ? ' AND ' : ' WHERE ') + 'name LIKE ?';
      params.push(`%${filters.name}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const models = stmt.all(...params) as ModelConfig[];

    stmt.finalize();
    return models;

  } finally {
    closeDatabase(db);
  }
}
```

### 4.4 Get Model By ID Function

```typescript
export function getModelById(id: number): ModelConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare('SELECT * FROM models WHERE id = ?').get(id);

    if (!row) return null;

    const stmt.finalize();
    return row as ModelConfig;

  } finally {
    closeDatabase(db);
  }
}
```

### 4.5 Get Model By Name Function

```typescript
export function getModelByName(name: string): ModelConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare('SELECT * FROM models WHERE name = ?').get(name);

    if (!row) return null;

    const stmt.finalize();
    return row as ModelConfig;

  } finally {
    closeDatabase(db);
  }
}
```

### 4.6 Update Model Function

```typescript
export function updateModel(id: number, updates: Partial<Omit<ModelConfig, 'id' | 'name' | 'type' | 'created_at'>>): void {
  const db = initDatabase();

  try {
    const fields = Object.keys(updates).map(key => key + ' = ?').join(', ');
    const values = Object.values(updates);

    const stmt = db.prepare(`
      UPDATE models
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run([...values, Date.now()], id);
    stmt.finalize();

  } finally {
    closeDatabase(db);
  }
}
```

### 4.7 Delete Model Function

```typescript
export function deleteModel(id: number): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare('DELETE FROM models WHERE id = ?');
    stmt.run(id);
    stmt.finalize();

  } finally {
    closeDatabase(db);
  }
}
```

### 4.8 Delete All Models Function

```typescript
export function deleteAllModels(): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare('DELETE FROM models');
    stmt.run();
    stmt.finalize();

  } finally {
    closeDatabase(db);
  }
}
```

---

## 📝 Phase 5: Metadata API

### 5.1 Set Metadata Function

```typescript
export function setMetadata(key: string, value: string): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      INSERT INTO metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    stmt.run(key, value, Date.now());
    stmt.finalize();

  } finally {
    closeDatabase(db);
  }
}
```

### 5.2 Get Metadata Function

```typescript
export function getMetadata(key: string): string | null {
  const db = initDatabase();

  try {
    const row = db.prepare('SELECT value FROM metadata WHERE key = ?').get(key);

    if (!row) return null;

    const stmt.finalize();
    return row[0] as string;

  } finally {
    closeDatabase(db);
  }
}
```

### 5.3 Delete Metadata Function

```typescript
export function deleteMetadata(key: string): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare('DELETE FROM metadata WHERE key = ?');
    stmt.run(key);
    stmt.finalize();

  } finally {
    closeDatabase(db);
  }
}
```

---

## 🛠️ Phase 6: Advanced Database Operations

### 6.1 Vacuum Database Function

```typescript
export function vacuumDatabase(): void {
  const db = initDatabase();

  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.vacuum();
    console.log('Database vacuumed successfully');

  } finally {
    closeDatabase(db);
  }
}
```

### 6.2 Export Database Function

```typescript
export function exportDatabase(filePath: string): void {
  const db = initDatabase();

  try {
    const backupDb = new Database(filePath, { readonly: false });
    db.backup(backupDb);
    backupDb.close();
    console.log(`Database exported to ${filePath}`);

  } finally {
    closeDatabase(db);
  }
}
```

### 6.3 Import Database Function

```typescript
export function importDatabase(filePath: string): void {
  const db = initDatabase();

  try {
    db.exec(`ATTACH DATABASE ? AS backup`);
    db.exec(`
      INSERT INTO main.metrics_history
      SELECT * FROM backup.metrics_history;

      INSERT INTO main.models
      SELECT * FROM backup.models;

      INSERT INTO main.metadata
      SELECT * FROM backup.metadata;

      DETACH DATABASE backup;
    `);
    console.log(`Database imported from ${filePath}`);

  } finally {
    closeDatabase(db);
  }
}
```

---

## 🔌 Phase 7: Integration with WebSocket Handler

### 7.1 Update WebSocket Message Handler

**File:** `src/providers/websocket-provider.tsx`

**Changes needed:**

```typescript
// Add import
import { saveMetrics } from '@/lib/database';

// In handleMessage function, add metrics saving:
case 'metrics': {
  if (data && typeof data === 'object') {
    saveMetrics({
      cpu_usage: data.cpuUsage,
      memory_usage: data.memoryUsage,
      disk_usage: data.diskUsage,
      gpu_usage: data.gpuUsage,
      gpu_temperature: data.gpuTemperature,
      gpu_memory_used: data.gpuMemoryUsed,
      gpu_memory_total: data.gpuMemoryTotal,
      gpu_power_usage: data.gpuPowerUsage,
      active_models: data.activeModels,
      uptime: data.uptime,
      requests_per_minute: data.requestsPerMinute
    });
  }
  break;
}
```

### 7.2 Load Metrics History on Dashboard Mount

**File:** `src/hooks/useChartHistory.ts` or `src/components/dashboard/ModernDashboard.tsx`

**Changes needed:**

```typescript
import { useEffect } from 'react';
import { getMetricsHistory } from '@/lib/database';

// In your dashboard component
useEffect(() => {
  // Load last 10 minutes of metrics for chart restoration
  const history = getMetricsHistory(10);

  // Convert to chart data format
  const cpuData = history.map(entry => ({
    time: new Date(entry.timestamp).toLocaleTimeString(),
    displayTime: new Date(entry.timestamp).toISOString(),
    value: entry.cpu_usage
  }));

  const memoryData = history.map(entry => ({
    time: new Date(entry.timestamp).toLocaleTimeString(),
    displayTime: new Date(entry.timestamp).toISOString(),
    value: entry.memory_usage
  }));

  const gpuUtilData = history.map(entry => ({
    time: new Date(entry.timestamp).toLocaleTimeString(),
    displayTime: new Date(entry.timestamp).toISOString(),
    value: entry.gpu_usage
  }));

  const powerData = history.map(entry => ({
    time: new Date(entry.timestamp).toLocaleTimeString(),
    displayTime: new Date(entry.timestamp).toISOString(),
    value: entry.gpu_power_usage
  }));

  const requestsData = history.map(entry => ({
    time: new Date(entry.timestamp).toLocaleTimeString(),
    displayTime: new Date(entry.timestamp).toISOString(),
    value: entry.requests_per_minute
  }));

  // Update your chart state or context
  setChartHistory({
    cpu: cpuData,
    memory: memoryData,
    requests: requestsData,
    gpuUtil: gpuUtilData,
    power: powerData
  });
}, []);
```

---

## 🎨 Phase 8: Integration with Model Management UI

### 8.1 Update Model Management Page

**File:** `src/app/models/page.tsx` or related components

**Changes needed:**

```typescript
import { getModels, saveModel, updateModel, deleteModel } from '@/lib/database';
import { useEffect, useState } from 'react';

function ModelsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);

  useEffect(() => {
    // Load all models on mount
    const allModels = getModels();
    setModels(allModels);
  }, []);

  const handleSaveModel = (config: Partial<ModelConfig>) => {
    const id = saveModel({
      name: config.name!,
      type: 'llama',
      status: 'stopped',
      // ... all other parameters
    });

    // Refresh models list
    const allModels = getModels();
    setModels(allModels);
  };

  const handleStartModel = (id: number) => {
    updateModel(id, {
      status: 'running',
      updated_at: Date.now()
    });

    // Update UI
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'running' } : m));
  };

  const handleStopModel = (id: number) => {
    updateModel(id, {
      status: 'stopped',
      updated_at: Date.now()
    });

    // Update UI
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'stopped' } : m));
  };

  return (
    // ... your models UI
  );
}
```

### 8.2 Update Dashboard Header

**File:** `src/components/dashboard/DashboardHeader.tsx`

**Changes needed:**

```typescript
import { getMetadata } from '@/lib/database';

// In DashboardHeader component
const serverStartTime = getMetadata('server_start_time');

// Display server uptime or last start time
if (serverStartTime) {
  const uptimeMs = Date.now() - parseInt(serverStartTime);
  // Format and display uptime
}
```

---

## 🧪 Phase 9: App Initialization

### 9.1 Add Database Initialization to Root Layout

**File:** `src/app/layout.tsx` or `src/providers/app-provider.tsx`

**Changes needed:**

```typescript
import { useEffect } from 'react';
import { initDatabase, closeDatabase } from '@/lib/database';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize database on app mount
    const db = initDatabase();

    // Optional: Load metrics history for charts
    // const history = getMetricsHistory(10);

    return () => {
      // Cleanup database on app unmount
      closeDatabase();
    };
  }, []);

  return (
    <html>
      {/* ... your existing layout */}
    </html>
  );
}
```

---

## ✅ Phase 10: Testing

### 10.1 Database Tests

**File:** `__tests__/lib/database.test.ts`

```typescript
import { initDatabase, closeDatabase, saveMetrics, getMetricsHistory, saveModel, getModels, updateModel, deleteModel } from '@/lib/database';

describe('Database Operations', () => {
  let db: any;

  beforeEach(() => {
    // Use test database
    db = initDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('saveMetrics', () => {
    it('should save metrics and auto-cleanup old records', () => {
      saveMetrics({ cpu_usage: 50, memory_usage: 60 });

      const history = getMetricsHistory(10);
      expect(history).toHaveLength(1);
    });
  });

  describe('saveModel', () => {
    it('should save model configuration', () => {
      const id = saveModel({ name: 'test-model', type: 'llama', status: 'stopped' });

      expect(id).toBeGreaterThan(0);

      const model = getModelById(id);
      expect(model?.name).toBe('test-model');
    });
  });

  describe('getModels', () => {
    it('should return all models', () => {
      saveModel({ name: 'model1', type: 'llama', status: 'stopped' });
      saveModel({ name: 'model2', type: 'llama', status: 'running' });

      const models = getModels();
      expect(models).toHaveLength(2);
    });
  });

  describe('updateModel', () => {
    it('should update model status', () => {
      const id = saveModel({ name: 'test-model', type: 'llama', status: 'stopped' });
      updateModel(id, { status: 'running' });

      const model = getModelById(id);
      expect(model?.status).toBe('running');
    });
  });

  describe('metadata', () => {
    it('should set and get metadata', () => {
      setMetadata('theme', 'dark');
      const value = getMetadata('theme');
      expect(value).toBe('dark');
    });
  });
});
```

### 10.2 Integration Tests

**File:** `__tests__/integration/database-integration.test.tsx`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useChartHistory } from '@/hooks/useChartHistory';

describe('Database Integration', () => {
  it('should load metrics history on mount', () => {
    const { result } = renderHook(() => useChartHistory());

    // Wait for database operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current).toBeDefined();
  });
});
```

---

## 📦 Phase 11: Deployment

### 11.1 Add to .gitignore

```gitignore
# Database files
data/*.db
data/*.db-shm
data/*.db-wal
data/backup/
```

### 11.2 Update Package.json

```json
{
  "scripts": {
    "db:export": "node -e \"require('./src/lib/database').exportDatabase('./backup/llama-dashboard.db')\"",
    "db:import": "node -e \"require('./src/lib/database').importDatabase('./backup/llama-dashboard.db')\"",
    "db:vacuum": "node -e \"require('./src/lib/database').vacuumDatabase()\""
  }
}
```

---

## 📊 Phase 12: Performance & Monitoring

### 12.1 Database Size Monitoring

Expected database sizes:
- **Empty database:** ~20 KB
- **10 minutes metrics:** ~100-200 KB
- **Model records:** ~5 KB per model (with full parameters)
- **100 models:** ~500 KB

### 12.2 Performance Targets

- **Save metrics:** <1ms (WAL mode + prepared statement)
- **Query metrics:** <1ms (with indexes)
- **Auto-cleanup:** <10ms (DELETE query)
- **Load models:** <5ms (with name index)

---

## 🎯 Implementation Checklist

### Phase 1: Setup & Installation
- [ ] Install `better-sqlite3` package
- [ ] Create `data/` directory
- [ ] Add to `.gitignore`

### Phase 2: Database Implementation
- [ ] Create `src/lib/database.ts` file
- [ ] Implement `initDatabase()` function
- [ ] Implement `closeDatabase()` function
- [ ] Create tables (metrics_history, models, metadata)
- [ ] Create indexes for performance

### Phase 3: Metrics History API
- [ ] Implement `saveMetrics()` function
- [ ] Implement `getMetricsHistory(minutes)` function
- [ ] Implement `getLatestMetrics()` function
- [ ] Add auto-cleanup logic (10 minutes)

### Phase 4: Models Management API
- [ ] Define `ModelConfig` TypeScript interface
- [ ] Implement `saveModel()` function
- [ ] Implement `getModels(filters)` function
- [ ] Implement `getModelById(id)` function
- [ ] Implement `getModelByName(name)` function
- [ ] Implement `updateModel(id, updates)` function
- [ ] Implement `deleteModel(id)` function
- [ ] Implement `deleteAllModels()` function

### Phase 5: Metadata API
- [ ] Implement `setMetadata(key, value)` function
- [ ] Implement `getMetadata(key)` function
- [ ] Implement `deleteMetadata(key)` function

### Phase 6: Advanced Database Operations
- [ ] Implement `vacuumDatabase()` function
- [ ] Implement `exportDatabase(filePath)` function
- [ ] Implement `importDatabase(filePath)` function

### Phase 7: Integration with WebSocket Handler
- [ ] Update WebSocket provider to save metrics
- [ ] Add metrics saving to `handleMessage` function
- [ ] Load metrics history on dashboard components

### Phase 8: Integration with Model Management UI
- [ ] Update models page to use database API
- [ ] Add save/update/delete handlers
- [ ] Load models from database on mount

### Phase 9: App Initialization
- [ ] Add database init to root layout
- [ ] Initialize database on app startup
- [ ] Cleanup database on app unmount

### Phase 10: Testing
- [ ] Create database unit tests
- [ ] Test save/retrieve metrics operations
- [ ] Test save/retrieve/update/delete model operations
- [ ] Test metadata operations
- [ ] Create integration tests

### Phase 11: Deployment
- [ ] Add database files to `.gitignore`
- [ ] Add database scripts to `package.json`
- [ ] Test database backup/restore functionality

### Phase 12: Performance & Monitoring
- [ ] Test database query performance
- [ ] Verify auto-cleanup is working
- [ ] Monitor database size
- [ ] Optimize indexes if needed

---

## 🚀 Quick Start Commands

### Install and Setup
```bash
# 1. Install dependencies
pnpm add -D better-sqlite3 @types/better-sqlite3

# 2. Create data directory
mkdir -p data

# 3. Create database file
# (Will be created automatically on first run)
```

### Run Tests
```bash
# Run database tests
pnpm test __tests__/lib/database.test.ts

# Run integration tests
pnpm test __tests__/integration/database-integration.test.tsx
```

### Development
```bash
# Start dev server
pnpm dev

# Database will be initialized automatically on first page load
```

---

## 📝 Notes

### Best Practices

1. **Always close database connections** - Use try/finally blocks
2. **Use prepared statements** - Better performance and SQL injection prevention
3. **Transaction safety** - Database uses implicit transactions per statement
4. **Error handling** - All functions should handle exceptions gracefully
5. **Type safety** - All functions have proper TypeScript types
6. **Testing** - Write tests before integrating with UI

### Common Issues & Solutions

**Issue:** Database locked
**Solution:** WAL mode handles concurrent reads/writes automatically

**Issue:** Performance degradation
**Solution:** Regular vacuum operations and auto-cleanup of old metrics

**Issue:** Schema changes break data
**Solution:** Version number in metadata, handle migrations in future

---

## 🔗 Related Documentation

- **DATABASE_SCHEMA.md** - Complete schema reference
- **DATABASE_INSTALL_COMPLETE.md** - Installation guide
- **API.md** - WebSocket API reference
- **ARCHITECTURE.md** - Application architecture overview

---

## ✨ Benefits of Implementation

1. **Persistence** - Metrics and models survive page refresh/restart
2. **Performance** - WAL mode, indexed queries, auto-cleanup
3. **Flexibility** - Supports ALL 100+ llama-server parameters
4. **Type Safety** - Full TypeScript support prevents errors
5. **Lightweight** - ~800 KB database with minimal overhead
6. **Scalable** - SQLite scales well for dashboard use case
7. **Backup/Restore** - Export/import for data safety
8. **Testability** - Easy to test and maintain

---

**Implementation Status:** 📋 **PLANNING PHASE**

**Next Steps:**
1. Review this plan
2. Provide feedback or modifications
3. Begin implementation starting with Phase 1
4. Test incrementally after each phase
5. Deploy when all phases complete
