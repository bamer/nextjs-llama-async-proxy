import * as fs from "fs";

/**
 * Check if fit-params analysis is needed
 */
export function shouldAnalyze(
  lastAnalyzedAt: number | null,
  modelPath: string | null
): boolean {
  if (!modelPath || !fs.existsSync(modelPath)) {
    return false;
  }

  // If never analyzed, need to analyze
  if (!lastAnalyzedAt) {
    return true;
  }

  // Get file modification time
  const stats = fs.statSync(modelPath);
  const fileModifiedTime = stats.mtimeMs;

  return fileModifiedTime > lastAnalyzedAt;
}
