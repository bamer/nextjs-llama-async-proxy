import * as fs from "fs";
import { initDatabase, closeDatabase } from "../database-client";
import type { ModelFitParams } from "../types/model-config.types";

export function saveModelFitParams(
  modelId: number,
  fitParams: Omit<ModelFitParams, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO model_fit_params (
        model_id, recommended_ctx_size, recommended_gpu_layers, recommended_tensor_split,
        file_size_bytes, quantization_type, parameter_count, architecture, context_window,
        fit_params_analyzed_at, fit_params_success, fit_params_error, fit_params_raw_output,
        projected_cpu_memory_mb, projected_gpu_memory_mb, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      modelId,
      fitParams.recommended_ctx_size ?? null,
      fitParams.recommended_gpu_layers ?? null,
      fitParams.recommended_tensor_split ?? null,
      fitParams.file_size_bytes ?? null,
      fitParams.quantization_type ?? null,
      fitParams.parameter_count ?? null,
      fitParams.architecture ?? null,
      fitParams.context_window ?? null,
      fitParams.fit_params_analyzed_at ?? now,
      fitParams.fit_params_success ?? 0,
      fitParams.fit_params_error ?? null,
      fitParams.fit_params_raw_output ?? null,
      fitParams.projected_cpu_memory_mb ?? null,
      fitParams.projected_gpu_memory_mb ?? null,
      now,
      now
    );

    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function getModelFitParams(modelId: number): ModelFitParams | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM model_fit_params WHERE model_id = ?").get(modelId);

    if (!row) return null;
    return row as ModelFitParams;
  } finally {
    closeDatabase(db);
  }
}

export function shouldReanalyzeFitParams(modelId: number, modelPath: string): boolean {
  const db = initDatabase();

  try {
    const model = db.prepare("SELECT last_fit_params_check FROM models WHERE id = ?").get(modelId) as {
      last_fit_params_check: number | null;
    } | undefined;

    if (!model || !model.last_fit_params_check) {
      return true;
    }

    if (!fs.existsSync(modelPath)) {
      return false;
    }

    const stats = fs.statSync(modelPath);
    const fileModifiedTime = stats.mtimeMs;

    return fileModifiedTime > model.last_fit_params_check;
  } finally {
    closeDatabase(db);
  }
}
