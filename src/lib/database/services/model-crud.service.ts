import { initDatabase, closeDatabase } from "../database-client";
import type { ModelConfig } from "@/types/model-config-types";

export function saveModel(
  config: Omit<ModelConfig, "id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT INTO models (
        name, type, status,
        model_path, model_url, docker_repo, hf_repo, hf_repo_draft, hf_file, hf_file_v, hf_token,
        ctx_size, predict, batch_size, ubatch_size, n_parallel, cont_batching,
        threads, threads_batch, cpu_mask, cpu_range, cpu_strict, cpu_mask_batch,
        cpu_range_batch, cpu_strict_batch, priority, priority_batch,
        file_size_bytes, fit_params_available, last_fit_params_check,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      config.name,
      config.type || "llama",
      config.status || "stopped",
      config.model_path ?? null,
      config.model_url ?? null,
      config.docker_repo ?? null,
      config.hf_repo ?? null,
      config.hf_repo_draft ?? null,
      config.hf_file ?? null,
      config.hf_file_v ?? null,
      config.hf_token ?? null,
      config.ctx_size ?? 0,
      config.predict ?? -1,
      config.batch_size ?? 2048,
      config.ubatch_size ?? 512,
      config.n_parallel ?? -1,
      config.cont_batching ?? 0,
      config.threads ?? -1,
      config.threads_batch ?? null,
      config.cpu_mask ?? null,
      config.cpu_range ?? null,
      config.cpu_strict ?? 0,
      config.cpu_mask_batch ?? null,
      config.cpu_range_batch ?? null,
      config.cpu_strict_batch ?? 0,
      config.priority ?? 0,
      config.priority_batch ?? null,
      config.file_size_bytes ?? null,
      config.fit_params_available ?? 0,
      config.last_fit_params_check ?? null,
      now,
      now
    );

    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function getModels(
  filters?: Partial<Pick<ModelConfig, "status" | "type" | "name">>
): ModelConfig[] {
  const db = initDatabase();

  try {
    let query = "SELECT * FROM models";
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters?.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    if (filters?.type) {
      conditions.push("type = ?");
      params.push(filters.type);
    }

    if (filters?.name) {
      conditions.push("name LIKE ?");
      params.push(`%${filters.name}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const stmt = db.prepare(query);
    const models = stmt.all(...params) as ModelConfig[];
    return models;
  } finally {
    closeDatabase(db);
  }
}

export function getModelById(id: number): ModelConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM models WHERE id = ?").get(id);

    if (!row) return null;
    return row as ModelConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getModelByName(name: string): ModelConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM models WHERE name = ?").get(name);

    if (!row) return null;
    return row as ModelConfig;
  } finally {
    closeDatabase(db);
  }
}

export function updateModel(
  id: number,
  updates: Partial<Omit<ModelConfig, "id" | "name" | "type" | "created_at">>
): void {
  const db = initDatabase();

  try {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);

    const stmt = db.prepare(`
      UPDATE models
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, Date.now(), id);
  } finally {
    closeDatabase(db);
  }
}

export function deleteModel(id: number): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM models WHERE id = ?");
    stmt.run(id);
  } finally {
    closeDatabase(db);
  }
}

export function deleteAllModels(): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM models");
    stmt.run();
  } finally {
    closeDatabase(db);
  }
}
