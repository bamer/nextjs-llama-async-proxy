import fs from "fs";
import { initDatabase, closeDatabase } from "./database-client";

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
