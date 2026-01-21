import { promises as fsPromises } from 'fs';
import path from 'path';

/**
 * Path to the JSON file that stores model status.
 * Exported so other modules can import it if needed.
 */
export const STATE_FILE_NAME = 'models-state.json';
export const STATE_FILE = path.join(process.cwd(), 'data', STATE_FILE_NAME);

/**
 * Atomically persist the extended model state to disk.
 * Guarantees that a partially‑written JSON file never appears.
 */
export async function persistState(state: Record<string, any>): Promise<void> {
  const tmp = STATE_FILE + '.tmp';
  await fsPromises.writeFile(tmp, JSON.stringify(state), 'utf8');
  await fsPromises.rename(tmp, STATE_FILE);
}