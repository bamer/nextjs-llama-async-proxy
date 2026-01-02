import { initDatabase, closeDatabase } from "../database-client";
import type { ModelConfig } from "./ModelConfig.types";

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


