import path from 'path';

/**
 * Resolve the binary path for a given model name and optionally check its existence.
 *
 * @param model - validated model directory name
 * @returns Absolute path to the model's binary file
 */
export function resolveBinary(model: string): string {
  return path.join(process.cwd(), 'data', 'models', model, 'model.bin');
}

/**
 * Check if the binary file for a model exists and is readable.
 * Exported as `binaryExists` to match the import used in `process-manager.ts`.
 */
export async function binaryExists(model: string): Promise<boolean> {
  try {
    await import('fs').then(fs => fs.promises.access(resolveBinary(model), fs.constants.R_OK));
    return true;
  } catch {
    return false;
  }
}